import { Vue } from 'vue/types/vue';

declare module 'vue/types/vue' {
  interface Vue {
    readonly $style: Record<string, string>;
  }
}
