<template>
  <div
    class="dropdown-menu"
    ref="menu"
    :style="coords"
    role="menu">
    <a
      class="dropdown-item"
      href="#"
      v-for="(item, i) in items"
      :key="i"
      @click.prevent="handleClick(item)">
      {{ item.name }}
    </a>
  </div>
</template>

<script>
import $ from 'jquery';

export default {
  computed: {
    contextMenuEvent() { return this.$store.state.contextMenuEvent; },
    pxPerMm() { return this.$store.state.pxPerMm; },
    coords() {
      const coords = { top: 0, left: 0 };
      if (this.contextMenuEvent) {
        coords.top = `${this.contextMenuEvent.e.evt.layerY}px`;
        coords.left = `${this.contextMenuEvent.e.evt.layerX}px`;
      }
      return coords;
    },
    part() {
      if (!('partIndex' in this.contextMenuEvent)) return null;
      return this.$store.state.parts.partsInit[this.contextMenuEvent.partIndex];
    },
    border() {
      if (!this.part || !('borderIndex' in this.contextMenuEvent)) return null;
      return this.part.borders[this.contextMenuEvent.borderIndex];
    },
    point() {
      if (!this.part || !('pointIndex' in this.contextMenuEvent)) return null;
      return this.part.points[this.contextMenuEvent.pointIndex];
    },
    items() {
      if (!this.contextMenuEvent) return [];
      const items = [];
      const { attrs } = this.contextMenuEvent.e.target;
      const { partIndex, borderIndex } = this.contextMenuEvent;
      switch (attrs.type) {
        case 'part':
          return [
            {
              name: 'Удалить элемент',
              action: 'deletePart',
              partIndex,
            },
            {
              name: 'Добавить размер',
              action: 'addSingleSizeTag',
              partIndex,
            },
            {
              name: 'Добавить мойку',
              action: 'addWashing',
              partIndex,
              left: this.contextMenuEvent.e.evt.layerX / this.pxPerMm,
              top: this.contextMenuEvent.e.evt.layerY / this.pxPerMm,
            },
          ];
        case 'lineBorder':
          if (attrs.isClickable) {
            items.push(...[
              {
                name: 'Вставить точку',
                action: 'addPoint',
                borderIndex,
              },
              {
                name: 'Сделать выпуклой',
                isInside: false,
                action: 'makeBorderCurve',
                borderIndex,
              },
              {
                name: 'Сделать вогнутой',
                isInside: true,
                action: 'makeBorderCurve',
                borderIndex,
              },
              {
                name: 'Сделать вырез',
                isInside: true,
                action: 'makeBulgeInset',
                borderIndex,
              },
              {
                name: 'Сделать выступ',
                isInside: false,
                action: 'makeBulgeInset',
                borderIndex,
              },
            ]);
          }
          items.push({
            name: 'Добавить/убрать бортик',
            action: 'toggleSkirting',
            borderIndex,
          });
          if (!this.border.sizeTag.isShown && attrs.isHoverable) {
            items.push({
              name: 'Показать размер',
              action: 'showSizeArrow',
              borderIndex,
            });
          }
          if (this.border && (!this.border.edgeTag || !this.border.edgeTag.isShown)) {
            items.push({
              name: 'Добавить кромку',
              action: 'addEdge',
              borderIndex,
            });
          }
          return items;
        case 'curveBorder':
          items.push(
            {
              name: 'Сделать прямой',
              action: 'makeBorderLine',
              borderIndex,
            },
            {
              name: 'Добавить/убрать бортик',
              action: 'toggleSkirting',
              borderIndex,
            },
          );
          if (attrs.isInside) {
            items.push(
              {
                name: 'Сделать выпуклой',
                isInside: false,
                action: 'makeBorderCurve',
                borderIndex,
              },
            );
          } else {
            items.push(
              {
                name: 'Сделать вогнутой',
                isInside: true,
                action: 'makeBorderCurve',
                borderIndex,
              },
            );
          }
          if (!this.border.radiusTag.isShown) {
            items.push({
              name: 'Показать радиус',
              action: 'showRadius',
              borderIndex,
            });
          }
          if (this.border && this.border.edgeTag && !this.border.edgeTag.isShown) {
            items.push({
              name: 'Добавить кромку',
              action: 'addEdge',
              borderIndex,
            });
          }
          return items;
        case 'point': {
          const j2 = this.contextMenuEvent.pointIndex;
          const j1 = j2 > 0 ? j2 - 1 : this.part.points.length - 1;
          const border1 = this.part.borders[j1];
          const border2 = this.part.borders[j2];
          if (border1.type === 'lineBorder' && border2.type === 'lineBorder') {
            if (!('insetBulgeId' in this.point)) {
              items.push(...[
                {
                  name: 'Удалить точку',
                  action: 'deletePoint',
                  pointIndex: this.contextMenuEvent.pointIndex,
                },
                {
                  name: 'Сделать вырез',
                  action: 'makeCorderCut',
                  pointIndex: this.contextMenuEvent.pointIndex,
                },
              ]);
            }
            items.push(
              {
                name: 'Закруглить угол',
                action: 'makeRounded',
                pointIndex: this.contextMenuEvent.pointIndex,
              },
            );
            if (!this.point.angleTag.isShown) {
              items.push({
                name: 'Показать угол',
                action: 'showAngle',
                pointIndex: this.contextMenuEvent.pointIndex,
              });
            }
          }
          return items;
        }
        case 'inset':
        case 'bulge':
          return [
            {
              name: 'Удалить выступ/вырез',
              action: 'deleteInsetBulge',
              insetBulgeIndex: this.contextMenuEvent.insetBulgeIndex,
            },
          ];
        case 'sizeArrow':
          return [
            {
              name: 'Скрыть',
              action: 'hideSizeArrow',
              borderIndex,
            },
          ];
        case 'radius':
          return [
            {
              name: 'Скрыть',
              action: 'hide',
              borderIndex,
            },
          ];
        case 'angleTag':
          return [
            {
              name: 'Скрыть',
              action: 'hideAngle',
              pointIndex: this.contextMenuEvent.pointIndex,
            },
          ];
        case 'edge':
          return [
            {
              name: 'Скрыть',
              action: 'hideEdge',
              borderIndex,
            },
          ];
        case 'totalText':
          return [
            {
              name: 'Удалить текст',
              action: 'deleteTotalText',
              textIndex: this.contextMenuEvent.textIndex,
            },
          ];
        case 'singleSizeTag':
          return [
            {
              name: 'Удалить размер',
              action: 'deleteSingleSizeTag',
              sizeTagIndex: this.contextMenuEvent.sizeTagIndex,
            },
          ];
        case 'legend':
          return [
            {
              name: 'Удалить элемент легенды',
              action: 'deleteLegend',
              legendIndex: this.contextMenuEvent.legendIndex,
            },
          ];
        case 'washing':
          return [
            {
              name: 'Удалить мойку',
              action: 'deleteWashing',
              washingIndex: this.contextMenuEvent.washingIndex,
            },
          ];
        default:
          return [];
      }
    },
  },
  watch: {
    contextMenuEvent() {
      this.console.log('ctxtmenu');
      $(this.$refs.menu).dropdown('show');
    },
  },
  mounted() {
    $('body')
      .click(() => {
        $(this.$refs.menu).dropdown('hide');
      });
  },
  methods: {
    handleClick(item) {
      const payload = {
        ...item,
        partIndex: this.contextMenuEvent.partIndex,
      };
      this.$store.commit('setContextMenuEvent', null);
      this.$store.commit('setContextMenuAction', payload);
      setTimeout(() => {
        $(this.$refs.menu).dropdown('hide');
      }, 0);
    },
  },
};
</script>
