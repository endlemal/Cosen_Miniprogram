<template>
  <view class="slide-track" :class="{ dragging, locked: disabled, authorizing: authorize }">
    <view class="slide-path">
      <button v-if="authorize" class="slide-label authorize" :aria-label="label" tabindex="0"
        :open-type="phoneAuthorization ? 'getPhoneNumber' : undefined" :disabled="disabled"
        @getphonenumber="emit('phone', $event)" @tap="emit('authorize')" @keydown="keyActivate">{{ label }}</button>
      <button v-else class="slide-label" tabindex="0" role="button" :aria-label="label" :disabled="disabled" @tap="confirm" @keydown="keyActivate">
        <text>{{ label }}</text><text class="chevron" aria-hidden="true">›</text>
      </button>
      <view
        class="cup" :style="{ transform: 'translateX(' + position + 'px)' }"
        aria-hidden="true" @touchstart="touchStart" @touchmove.stop.prevent="touchMove"
        @touchend="touchEnd" @touchcancel="reset"
      >
        <view class="cup-body" :style="{ transform: 'rotate(' + tilt + 'deg)' }">
          <view class="handle" />
          <view class="rim">
            <view class="brew"><view class="wave" /><view class="bubbles" /></view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, nextTick, onMounted, onUnmounted, ref } from 'vue'

const props = defineProps<{ authorize: boolean; phoneAuthorization: boolean; disabled: boolean; label: string }>()
const emit = defineEmits<{
  (e: 'confirm' | 'authorize'): void
  (e: 'phone', event: { detail?: { code?: string } }): void
}>()
const instance = getCurrentInstance()
const travel = ref(0)
const position = ref(0)
const dragging = ref(false)
const tilt = computed(() => travel.value ? position.value / travel.value * 38 : 0)
let startX = 0
let touchId: number | undefined

function reset() {
  dragging.value = false
  position.value = 0
  touchId = undefined
}

function measure() {
  uni.createSelectorQuery().in(instance?.proxy)
    .select('.slide-path').boundingClientRect()
    .select('.cup').boundingClientRect()
    .exec(([path, cup]) => {
      if (path && cup) travel.value = Math.max(0, path.width - cup.width)
    })
}

function resize() {
  reset()
  nextTick(measure)
}

function confirm() {
  if (props.disabled || props.authorize) return reset()
  reset()
  emit('confirm')
}

function start(x: number) {
  if (props.disabled || props.authorize) return
  // #ifdef H5
  if (handle?.parentElement) travel.value = handle.parentElement.clientWidth - handle.offsetWidth
  // #endif
  if (dragging.value) return
  if (!travel.value) measure()
  startX = x
  dragging.value = true
}

function move(x: number) {
  if (dragging.value) position.value = Math.max(0, Math.min(travel.value, x - startX))
}

function release(x: number) {
  if (!dragging.value) return
  move(x)
  if (travel.value > 0 && position.value >= travel.value - 5) confirm()
  else reset()
}

interface CupTouch { identifier: number; clientX: number }
interface CupTouchEvent { touches: ArrayLike<CupTouch>; changedTouches: ArrayLike<CupTouch> }

function touchStart(event: CupTouchEvent) {
  if (event.touches.length !== 1) return reset()
  const touch = event.touches[0]
  touchId = touch.identifier
  start(touch.clientX)
}

function touchMove(event: CupTouchEvent) {
  if (event.touches.length !== 1) return reset()
  if (event.touches[0].identifier === touchId) move(event.touches[0].clientX)
}

function touchEnd(event: CupTouchEvent) {
  const touch = Array.from(event.changedTouches).find(t => t.identifier === touchId)
  if (touch) release(touch.clientX)
}

function keyActivate(event: KeyboardEvent) {
  if (props.disabled || (event.key !== 'Enter' && event.key !== ' ')) return
  event.preventDefault()
  if (props.authorize) emit('authorize')
  else confirm()
}

// #ifdef H5
let handle: HTMLElement | null = null
function mouseStart(event: MouseEvent) {
  if (event.button === 0 && touchId === undefined) start(event.clientX)
}
function mouseMove(event: MouseEvent) {
  if (touchId === undefined) move(event.clientX)
}
function mouseEnd(event: MouseEvent) {
  if (touchId === undefined) release(event.clientX)
}
// #endif

onMounted(() => {
  nextTick(measure)
  uni.onWindowResize(resize)
  // #ifdef H5
  handle = instance?.proxy?.$el.querySelector('.cup') ?? null
  handle?.addEventListener('mousedown', mouseStart)
  window.addEventListener('mousemove', mouseMove)
  window.addEventListener('mouseup', mouseEnd)
  window.addEventListener('blur', reset)
  // #endif
})
onUnmounted(() => {
  uni.offWindowResize(resize)
  // #ifdef H5
  handle?.removeEventListener('mousedown', mouseStart)
  window.removeEventListener('mousemove', mouseMove)
  window.removeEventListener('mouseup', mouseEnd)
  window.removeEventListener('blur', reset)
  // #endif
})
</script>

<style scoped>
.slide-track {
  position: relative; height: 64px; background: #f3e7d5; border-radius: 40px;
  box-shadow: inset 0 0 0 1px #fff7e7, 0 6px 20px rgba(36,18,9,.2);
  user-select: none;
}
.locked { opacity: .72; }
.locked .cup { cursor: default; }
.slide-path { position: absolute; inset: 4px; }
.slide-label {
  position: absolute; left: 60px; right: 0; top: 0; height: 100%;
  display: flex; align-items: center; justify-content: center; gap: 18px;
  margin: 0; padding: 0 8px; border: 0; background: transparent; color: #442a1a;
  font-size: 16px; font-weight: 600; letter-spacing: 1px; line-height: 1.2;
}
.slide-label.authorize { z-index: 2; left: -4px; right: -4px; top: -4px; height: 64px; padding-left: 66px; border-radius: 40px; }
.authorizing .cup { pointer-events: none; cursor: default; }
.slide-label::after { border: 0; }
.slide-label:focus-visible { outline: 2px solid #894c25; outline-offset: -4px; border-radius: 40px; }
.chevron { font: 28px/1 Georgia,serif; color: #846345; }
.cup {
  position: absolute; top: 0; left: 0; width: 56px; height: 56px; z-index: 1;
  cursor: grab; touch-action: none; transition: transform .24s ease-out;
}
.dragging .cup { transition: none; cursor: grabbing; }
.dragging .slide-label { opacity: .35; }
.cup-body, .rim { width: 100%; height: 100%; position: relative; }
.handle { position: absolute; width: 10px; height: 21px; top: -12px; left: 23px; border-radius: 6px; background: #fffbf2; }
.rim { box-sizing: border-box; padding: 4px; border-radius: 50%; background: #fffbf2; box-shadow: 4px 4px 0 rgba(63,41,25,.18); }
.brew { position: relative; overflow: hidden; width: 100%; height: 100%; border-radius: 50%; background: #b07b42; }
.wave { position: absolute; inset: -7%; transform: rotate(-26deg); background: linear-gradient(#79390e 50%, #b07b42 50%); }
.wave::before, .wave::after { content: ''; position: absolute; top: 25%; width: 51%; height: 50%; border-radius: 50%; }
.wave::before { left: 0; background: #79390e; }
.wave::after { right: 0; background: #b07b42; }
.bubbles {
  position: absolute; right: 3px; top: 14px; width: 13px; height: 15px;
  background: radial-gradient(circle at 38% 48%,#814414 0 2.5px,transparent 3px),
    radial-gradient(circle at 83% 52%,#814414 0 1.5px,transparent 2px),
    radial-gradient(circle at 66% 84%,#814414 0 1px,transparent 1.5px),
    radial-gradient(circle at 52% 14%,#814414 0 .8px,transparent 1.2px);
}
@media (prefers-reduced-motion: reduce) { .cup { transition: none; } }
</style>
