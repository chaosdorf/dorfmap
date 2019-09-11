import Vue from 'vue';
import './plugins/buefy';
import App from './App.vue';
import VueStates from '@sum.cumo/vue-states';

Vue.use(VueStates);

Vue.config.productionTip = false;

new Vue({
  render: h => h(App),
}).$mount('#app');
