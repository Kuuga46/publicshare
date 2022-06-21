import L from 'leaflet';
import '@supermap/iclient-leaflet';
import './index.less';
import emitter, * as eventNames from '../../Lib/Events';
import * as turf from '@turf/turf';
// 地图初始化
const map = L.map('map', {
  center: [32.826578, 118.233443],
  maxZoom: 17,
  minZoom: 3,
  zoom: 10,
  crs: L.CRS.TianDiTu_WGS84,
  doubleClickZoom: false,
});
L.supermap
  .tiandituTileLayer({
    key: '1d109683f4d84198e37a38c442d68311',
    pane: 'tilePane',
  })
  .addTo(map);
L.supermap.tiandituTileLayer({
  key: '1d109683f4d84198e37a38c442d68311',
  layerType: 'img',
  pane: 'tilePane',
});
//  多点测距功能

// 是否正在测距
let isMeasuringDistance = false;
// 是否是起点
let isFirstPoint = true;
// 上一个点
let latLngTemp = null;
// 绘制的所有图层marker,line
let resultLayer = [];
// 目前总距离
let resultDis = 0;
// 虚线段
let TempLine = null;
let TempMaker = null;
// 开始绘制初始化
const startMeasuring = () => {
  TempLine && TempLine.remove();
  TempMaker && TempMaker.remove();
  isMeasuringDistance = true;
  TempLine = null;
  TempMaker = null;
  resultDis = 0;
  latLngTemp = null;
  isFirstPoint = true;
  resultLayer = [];
};
emitter.on(eventNames.eventMapMeasureDistance, startMeasuring);
map.on('click', (ev) => {
  if (!isMeasuringDistance) return;
  // 清除虚线段
  TempLine && TempLine.remove();
  TempMaker && TempMaker.remove();
  if (isFirstPoint) {
    resultLayer.push(L.marker([ev.latlng.lat, ev.latlng.lng]).addTo(map)); //起始点
    const texticon = L.divIcon({
      //定义图标
      html: '起点',
      iconSize: [30, 20],
      iconAnchor: [15, 0],
    });
    resultLayer.push(
      L.marker([ev.latlng.lat, ev.latlng.lng], {
        icon: texticon,
      }).addTo(map)
    ); //marker实现文本框显示
    latLngTemp = ev.latlng; //存储上一点击点
    isFirstPoint = false;
  } else {
    if (!latLngTemp.equals(ev.latlng)) {
      //避免出现结束双击，导致距离为0
      const polyLine = L.polyline(
        [
          //与上一点连线
          [latLngTemp.lat, latLngTemp.lng],
          [ev.latlng.lat, ev.latlng.lng],
        ],
        {
          color: 'red',
        }
      ).addTo(map);
      resultLayer.push(polyLine);
      resultLayer.push(L.marker([ev.latlng.lat, ev.latlng.lng]).addTo(map)); // 最后点击点经纬度
      // 测量距离
      const from = turf.point([ev.latlng.lng, ev.latlng.lat]);
      const to = turf.point([latLngTemp.lng, latLngTemp.lat]);
      const distance = turf.distance(from, to, { units: 'kilometers' });
      resultDis += distance;
      const content = '距上点：' + Number(distance).toFixed(1) + '千米' + '<br>总距:' + Number(resultDis).toFixed(1) + '千米';
      const texticon = L.divIcon({
        html: content,
        iconSize: [110, 40],
        iconAnchor: [55, -5], //设置标签偏移避免遮盖
      });
      resultLayer.push(
        L.marker([ev.latlng.lat, ev.latlng.lng], {
          icon: texticon,
        }).addTo(map)
      );
      latLngTemp = ev.latlng; //更新临时变量为新点
    }
  }
});
map.on('mousemove', function (ev) {
  if (!latLngTemp || !isMeasuringDistance) return;
  TempLine && TempLine.remove();
  TempMaker && TempMaker.remove();
  TempLine = L.polyline(
    [
      //虚线临时线段
      [latLngTemp.lat, latLngTemp.lng],
      [ev.latlng.lat, ev.latlng.lng],
    ],
    {
      color: 'red',
      dashArray: '5,5',
    }
  ).addTo(map);
  const from = turf.point([ev.latlng.lng, ev.latlng.lat]);
  const to = turf.point([latLngTemp.lng, latLngTemp.lat]);
  const distance = turf.distance(from, to, { units: 'kilometers' });

  const texticon = L.divIcon({
    html: Number(distance).toFixed(1) + '千米',
    iconSize: 90,
    className: 'my-div-icon',
    iconAnchor: [45, -5],
  });
  TempMaker = L.marker([ev.latlng.lat, ev.latlng.lng], {
    icon: texticon,
  }).addTo(map);
});
map.on('dblclick', function (ev) {
  if (isMeasuringDistance) {
    // 此处添加一个删除图标，将resultlayer存下来，然后置空并将绘制状态设为false
    const thisTimeLayer = resultLayer;
    resultLayer = [];
    isMeasuringDistance = false;
    const texticon = L.divIcon({
      iconSize: 10,
      className: 'map-distance-delete',
      iconAnchor: [-10, 20],
    });
    thisTimeLayer.push(
      L.marker([ev.latlng.lat, ev.latlng.lng], {
        icon: texticon,
      })
        .addTo(map)
        .on('click', (e) => {
          thisTimeLayer.map((ele) => {
            ele.remove();
          });
        })
        .bindTooltip('点击清除绘制', { direction: 'left' })
    );
  } else {
    map.zoomIn();
  }
});
