<script setup lang="ts">
import { onLaunch } from '@dcloudio/uni-app'
import { hydrate } from '@/store'

onLaunch(() => {
  hydrate()
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
