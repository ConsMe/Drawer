import Vue from 'vue';
import VueKonva from 'vue-konva';
import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faArrowsAltH,
  faLongArrowAltRight,
  faLongArrowAltLeft,
  faReply,
  faShare,
  faSave,
  faFileImage,
  faFilePdf,
  faFont,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import App from './App.vue';
import store from './store';

library.add(faArrowsAltH, faLongArrowAltRight, faFont,
  faLongArrowAltLeft, faReply, faShare, faSave, faFileImage, faFilePdf);

Vue.component('font-awesome-icon', FontAwesomeIcon);
Vue.config.productionTip = false;
Vue.use(VueKonva);

Vue.mixin({
  methods: {
    clone(a) { return JSON.parse(JSON.stringify(a)); },
  },
});

new Vue({
  store,
  render: (h) => h(App),
}).$mount('#app');
