#!/usr/bin/env python3
"""Offline /app contract regression gate. Never calls business APIs or Apifox."""
import argparse
from decimal import Decimal
import json
from pathlib import Path
import re
import unittest
from unittest.mock import patch

import yaml
from jsonschema import Draft202012Validator
from referencing import Registry, Resource

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SPEC = ROOT / 'reference/cosen-api-v1.openapi.yaml'
METHODS = {'get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace'}
BASE = 'urn:cosen:app-contract'


class UniqueKeyLoader(yaml.SafeLoader):
    """PyYAML's default silently accepts duplicate mapping keys."""


def unique_mapping(loader, node):
    result = {}
    for key_node, value_node in node.value:
        key = loader.construct_object(key_node, deep=True)
        if key in result:
            raise ValueError(f'Duplicate YAML key {key!r} at line {key_node.start_mark.line + 1}')
        result[key] = loader.construct_object(value_node, deep=True)
    return result


UniqueKeyLoader.add_constructor(yaml.resolver.BaseResolver.DEFAULT_MAPPING_TAG, unique_mapping)
# JSON decimal multipleOf must not fail from binary floating-point rounding (e.g. 9.6 / 0.1).
UniqueKeyLoader.add_constructor('tag:yaml.org,2002:float', lambda loader, node: Decimal(node.value.replace('_', '')))


def pointer(parts):
    return '#/' + '/'.join(str(x).replace('~', '~0').replace('/', '~1') for x in parts)


def walk(value, parts=()):
    yield parts, value
    if isinstance(value, dict):
        for key, child in value.items():
            yield from walk(child, (*parts, key))
    elif isinstance(value, list):
        for index, child in enumerate(value):
            yield from walk(child, (*parts, index))


def resolve(ref):
    if not ref.startswith('#/'):
        raise ValueError(f'External reference not allowed in offline gate: {ref}')
    value = SPEC
    for part in ref[2:].split('/'):
        key = part.replace('~1', '/').replace('~0', '~')
        value = value[int(key)] if isinstance(value, list) else value[key]
    return value


def normalize(path):
    return re.sub(r'\{[^{}]+\}', '{}', path)


def frontend_operations(sources=None):
    """Extract current literal request/requestPage calls, not a general TypeScript parser.

    Covers src/api plus page-level calls, template expressions and the current receipt
    concatenation. Nonliteral URL expressions need a parser extension/manual review.
    """
    operations = set()
    pattern = re.compile(r'\brequest(?:Page)?(?:<[^;\n]*?>)?\(\s*([\'"`])(/app/.*?)\1', re.S)
    if sources is None:
        sources = [*ROOT.joinpath('src').rglob('*.ts'), *ROOT.joinpath('src').rglob('*.vue')]
    call_pattern = re.compile(r'\brequest(?:Page)?(?:<[^;\n]*?>)?\(\s*')
    for source in sources:
        if source == ROOT / 'src/api/request.ts':
            continue  # Generic implementation necessarily receives a variable path.
        text = re.sub(r'/\*.*?\*/|^\s*//[^\n]*', '', source.read_text(), flags=re.S | re.M)
        recognized = {match.start() for match in pattern.finditer(text)}
        unknown = [match.start() for match in call_pattern.finditer(text) if match.start() not in recognized]
        if unknown:
            raise ValueError(f'Unrecognized request expression in {source.relative_to(ROOT)}; extend extractor/manual review required')
        for match in pattern.finditer(text):
            path = re.sub(r'\$\{.*?\}', '{}', match[2])
            # Read the remainder of this call using balanced parentheses outside strings.
            depth, quote, escape, end = 1, None, False, match.end()
            for end in range(match.end(), len(text)):
                c = text[end]
                if quote:
                    if escape:
                        escape = False
                    elif c == '\\':
                        escape = True
                    elif c == quote:
                        quote = None
                elif c in '\'"`':
                    quote = c
                elif c == '(':
                    depth += 1
                elif c == ')':
                    depth -= 1
                    if depth == 0:
                        break
            tail = text[match.end():end]
            if re.match(r'\s*\+', tail):
                # Only the current receipt concatenation is supported; fail closed otherwise.
                if not re.match(r'\s*\+\s*d\.no\s*,', tail) or path != '/app/store/collection/receipts/':
                    raise ValueError(f'Unsupported computed request path in {source.relative_to(ROOT)}')
                path += '{}'
            options = tail.split(',', 1)[1].strip() if ',' in tail else ''
            if options and not options.startswith('{'):
                raise ValueError(f'Nonliteral request options in {source.relative_to(ROOT)}')
            method, depth, quote, escape = 'GET', 0, None, False
            for index, c in enumerate(options):
                if quote:
                    if escape:
                        escape = False
                    elif c == '\\':
                        escape = True
                    elif c == quote:
                        quote = None
                elif c in '\'\"`':
                    quote = c
                elif c in '{[(':
                    depth += 1
                elif c in '}])':
                    depth -= 1
                elif depth == 1 and c == 'm':
                    prop = re.match(r'method\s*:\s*[\'\"](GET|POST|PUT|PATCH|DELETE)[\'\"]', options[index:])
                    if prop:
                        method = prop[1]
                    elif re.match(r'method\b', options[index:]):
                        raise ValueError(f'Nonliteral request method in {source.relative_to(ROOT)}')
            operations.add((method, normalize(path.split('?', 1)[0])))
    return operations


def validate_at(schema_pointer, value):
    Draft202012Validator({'$ref': BASE + schema_pointer}, registry=REGISTRY).validate(value)


class ContractChecks(unittest.TestCase):
    def test_operation_structure_and_parameters(self):
        ids = []
        declared_tags = {tag['name'] for tag in SPEC['tags']}
        for path, method, op in OPS:
            with self.subTest(path=path, method=method):
                ids.append(op['operationId'])
                self.assertTrue(op['tags'])
                self.assertLessEqual(set(op['tags']), declared_tags)
                self.assertTrue(op['responses'])
                self.assertIn('security', op)
                for requirement in op['security']:
                    self.assertLessEqual(set(requirement), set(SPEC['components']['securitySchemes']))
                params = SPEC['paths'][path].get('parameters', []) + op.get('parameters', [])
                actual = {p['name'] for p in params if p.get('in') == 'path' and p.get('required')}
                self.assertEqual(set(re.findall(r'\{([^}]+)\}', path)), actual)
                for response in op['responses'].values():
                    self.assertTrue(response.get('description'))
        self.assertEqual(len(ids), len(set(ids)), 'Duplicate operationId')
        self.assertGreaterEqual(len(OPS), 34)

    def test_references_and_json_schemas(self):
        self.assertEqual(SPEC['openapi'], '3.1.0')
        for parts, node in walk(SPEC):
            if not isinstance(node, dict):
                continue
            with self.subTest(location=pointer(parts)):
                if '$ref' in node:
                    resolve(node['$ref'])
                self.assertNotIn('nullable', node, 'OAS 3.1 requires explicit null types')
                if parts and parts[-1] == 'schema':
                    Draft202012Validator.check_schema(node)
        for schema in SPEC['components']['schemas'].values():
            Draft202012Validator.check_schema(schema)

    def test_all_media_examples(self):
        count = 0
        for parts, media in walk(SPEC):
            if not isinstance(media, dict) or 'schema' not in media:
                continue
            examples = []
            if 'example' in media:
                examples.append(media['example'])
            for example in media.get('examples', {}).values():
                example = resolve(example['$ref']) if '$ref' in example else example
                if 'value' in example:
                    examples.append(example['value'])
            for value in examples:
                count += 1
                with self.subTest(location=pointer(parts)):
                    validate_at(pointer((*parts, 'schema')), value)
        self.assertGreater(count, 30, 'Example discovery unexpectedly empty')

    def test_extractor_boundaries(self):
        source = ROOT / 'src/services/contract-probe.ts'
        for text in ["request(url)", "request('/app/probe', options)",
                     "request('/app/' + suffix)", "request('/app/probe', {method: verb})"]:
            with self.subTest(source=text), patch.object(Path, 'read_text', return_value=text):
                with self.assertRaises(ValueError):
                    frontend_operations([source])
        for text, expected in [
            ("request('/app/probe?limit=1')", {('GET', '/app/probe')}),
            ("request('/app/probe', {data: {method: 'DELETE'}})", {('GET', '/app/probe')}),
            ("request('/app/probe', {method: 'POST', data: {method: 'DELETE'}})", {('POST', '/app/probe')}),
            ("request(`/app/orders/${orderNo}`, {method: 'PUT'})", {('PUT', '/app/orders/{}')}),
        ]:
            with self.subTest(source=text), patch.object(Path, 'read_text', return_value=text):
                self.assertEqual(frontend_operations([source]), expected)

    def test_frontend_coverage(self):
        calls = frontend_operations()
        documented = {(method.upper(), normalize(path)) for path, method, _ in OPS}
        self.assertGreaterEqual(len(calls), 30, 'Request extractor needs review after frontend refactor (2026-11-24: 注销账号已下线，/app/account/close 不再由小程序调用)')
        self.assertFalse(calls - documented, f'Undocumented frontend requests: {sorted(calls - documented)}')

    def test_pay_refund_and_nullable_fields(self):
        schemas = SPEC['components']['schemas']
        refunds = {'refund_pending', 'refunding', 'refund_error', 'refunded'}
        for name in ['Order', 'OrderDetail']:
            props = schemas[name]['properties']
            self.assertLessEqual(refunds, set(props['orderStatus']['enum']))
            self.assertLessEqual({'tableNo', 'refundReason', 'refundRequestedAt', 'refundedAt', 'payDeadline'}, set(props))
            for field in ['refundRequestedAt', 'refundedAt', 'payDeadline', 'paidAt']:
                validate_at(f'#/components/schemas/{name}/properties/{field}', None)
        query = next(p for p in SPEC['paths']['/app/orders']['get']['parameters'] if p['name'] == 'orderStatus')
        self.assertLessEqual(refunds, set(query['schema']['enum']))
        self.assertIn('tableNo', schemas['CreateOrderReq']['properties'])
        self.assertEqual(schemas['Product']['properties']['soldOut']['type'], 'boolean')
        for field in ['failCode', 'failMsg', 'paidAt', 'flowNo', 'expireAt']:
            validate_at(f'#/components/schemas/RechargeOrder/properties/{field}', None)
        for path in ['/app/orders', '/app/orders/{orderNo}/pay']:
            example = SPEC['paths'][path]['post']['responses']['403']['content']['application/json']['examples']['phoneRequired']
            self.assertEqual(resolve(example['$ref'])['value']['code'], 40310)
        media = SPEC['paths']['/app/orders/{orderNo}/pay']['post']['responses']['200']['content']['application/json']
        self.assertEqual(media['schema']['allOf'][1]['properties']['data']['$ref'], '#/components/schemas/PayOrderResult')
        for name in ['wechatPrepay', 'mixedPrepay']:
            data = media['examples'][name]['value']['data']
            self.assertEqual((data['orderStatus'], data['payStatus']), ('created', 'unpaid'))
            self.assertIn('wechatPayParams', data)
        self.assertNotIn('prepayId', schemas['WxPayParams']['required'])

    def test_public_receipt_and_html_entrances(self):
        receipt = SPEC['paths']['/app/store/collection/receipts/{no}']['get']
        self.assertEqual(receipt['security'], [])
        key = next(p for p in receipt['parameters'] if p['name'] == 'X-Receipt-Key')
        self.assertEqual((key['in'], key['required']), ('header', True))
        for path in ['/app/store/table-entrance', '/app/store/collection-entrance']:
            responses = SPEC['paths'][path]['get']['responses']
            self.assertIn('text/html', responses['200']['content'])
            self.assertIn('Location', responses['302']['headers'])
        self.assertIn('text/html', SPEC['paths']['/app/store/collection-entrance']['get']['responses']['410']['content'])

    def test_concrete_write_bodies(self):
        expected = {
            ('/app/member/profile', 'put'), ('/app/member/profile', 'post'),
            ('/app/orders/{orderNo}/refund', 'post'), ('/app/orders/{orderNo}/review', 'post'),
            ('/app/feedback', 'post'), ('/app/account/close', 'post'),
            ('/app/store/collection/prepay', 'post'),
        }
        for path, method in expected:
            schema = SPEC['paths'][path][method]['requestBody']['content']['application/json']['schema']
            schema = resolve(schema['$ref']) if '$ref' in schema else schema
            self.assertTrue(schema.get('properties'), f'Empty request model: {method} {path}')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--spec', type=Path, default=DEFAULT_SPEC, help='Alternate YAML for regression/mutation checks')
    args = parser.parse_args()
    SPEC = yaml.load(args.spec.read_text(), Loader=UniqueKeyLoader)
    resource = Resource.from_contents({'$schema': Draft202012Validator.META_SCHEMA['$id'], **SPEC})
    REGISTRY = Registry().with_resource(BASE, resource)
    OPS = [(path, method, op) for path, item in SPEC['paths'].items() for method, op in item.items() if method in METHODS]
    writes = [op for _, method, op in OPS if method in {'post', 'put', 'patch', 'delete'}]
    print(json.dumps({'version': SPEC['info']['version'], 'paths': len(SPEC['paths']), 'operations': len(OPS),
                      'schemas': len(SPEC['components']['schemas']), 'writes': len(writes),
                      'withBody': sum('requestBody' in op for op in writes),
                      'frontendOperations': len(frontend_operations())}, ensure_ascii=False), flush=True)
    unittest.main(argv=['check-app-contract'], verbosity=2)
