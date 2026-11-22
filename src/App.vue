<script setup lang="ts">
import { onLaunch, onShow } from '@dcloudio/uni-app'
import { bindTableNo, extractTableNo, hydrate } from '@/store'

function handleEntryQuery(options?: { query?: Record<string, any> }) {
  const tableNo = extractTableNo(options?.query)
  if (tableNo) {
    bindTableNo(tableNo)
  }
}

onLaunch((options) => {
  hydrate()
  handleEntryQuery(options as any)
})

onShow((options?: { query?: Record<string, any> }) => {
  handleEntryQuery(options)
})
</script>

<style lang="scss">
/* 全局：app.wxss 中的标签选择器会作用到所有页面与组件 */
page {
  background: $canvas;
  color: $ink;
  font-family: $font-cn;
  font-size: 28rpx;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}
view,
text,
scroll-view,
input,
button {
  box-sizing: border-box;
}
button::after {
  border: none;
}
</style>
