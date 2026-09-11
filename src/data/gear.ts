export type Vector3Tuple = [number, number, number];
export type GearMode = "gallery" | "room";

export interface GearAsset {
  display: string;
  room: string;
  preview: string;
  author: string;
  source: string;
  license: string;
  licenseUrl: string;
  modifications: string;
  generated?: boolean;
}

export interface GearDevice {
  id: string;
  name: string;
  shortName: string;
  category: string;
  color: string;
  configuration?: string;
  description?: string;
  asset: GearAsset | null;
  gallery: { rotation: Vector3Tuple; size: number };
  room: { position: Vector3Tuple; rotation: Vector3Tuple; size: number };
}

// Only attach an asset after its local GLBs, preview and provenance have passed QA.
// Room coordinates use metres; `size` is the model's longest bounding-box dimension.
export const gearDevices: GearDevice[] = [
  {
    id: "iphone-16-pro",
    name: "iPhone 16 Pro",
    shortName: "iPhone",
    category: "手机",
    color: "黑色",
    asset: {
      display: "/models/gear/iphone-16-pro-display.glb",
      room: "/models/gear/iphone-16-pro-room.glb",
      preview: "/models/gear/iphone-16-pro-preview.jpg",
      author: "tranminhluan",
      source:
        "https://sketchfab.com/3d-models/iphone-16-pro-96be8c7e49fa4f949855db3e7f2e64e0",
      license: "CC BY 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
      modifications:
        "保留原模型轮廓与 PBR 材质，将机身色调调整为黑色，并使用 Meshopt 与 WebP 压缩；另制作书房轻量版。",
    },
    gallery: { rotation: [0.08, -0.4, -0.12], size: 2.5 },
    room: {
      position: [-0.52, 0.925, -0.13],
      rotation: [-0.2, 0.2, 0],
      size: 0.16,
    },
  },
  {
    id: "airpods-3",
    name: "AirPods 第三代",
    shortName: "AirPods",
    category: "耳机",
    color: "白色",
    configuration: "充电盒与耳机",
    asset: {
      display: "/models/gear/airpods-3-display.glb",
      room: "/models/gear/airpods-3-room.glb",
      preview: "/models/gear/airpods-3-preview.jpg",
      author: "polyman Studio",
      source:
        "https://sketchfab.com/3d-models/airpods-3e-generation-ed331e742ab944e683dcddd59ab0713e",
      license: "CC BY 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
      modifications:
        "保留充电盒与两只耳机的独立几何，合并重复数据并使用 Meshopt 与 WebP 压缩；另制作书房轻量版。",
    },
    gallery: { rotation: [0.12, -0.3, 0], size: 2.3 },
    room: {
      position: [-0.18, 0.817, 0.24],
      rotation: [0, -0.3, 0],
      size: 0.105,
    },
  },
  {
    id: "apple-watch-11",
    name: "Apple Watch Series 11",
    shortName: "Apple Watch",
    category: "手表",
    color: "深空灰",
    configuration: "深色运动表带",
    asset: {
      display: "/models/gear/apple-watch-series-11-display.glb",
      room: "/models/gear/apple-watch-series-11-room.glb",
      preview: "/models/gear/apple-watch-series-11-preview.jpg",
      author: "Mark Peters",
      source:
        "https://sketchfab.com/3d-models/apple-watch-series-11-jet-black-2048px2-f78fcc4989cb45a6865b397af7fb2c98",
      license: "CC BY-NC 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-nc/4.0/",
      modifications:
        "保留原模型单网格 PBR 外观，合并重复数据并使用 Meshopt 与 WebP 压缩；另制作书房轻量版。",
    },
    gallery: { rotation: [1.34, -0.18, -0.58], size: 2.15 },
    room: {
      position: [0.43, 0.841, 0.17],
      rotation: [0, -0.3, 0],
      size: 0.115,
    },
  },
  {
    id: "macbook-pro-14",
    name: "MacBook Pro",
    shortName: "MacBook",
    category: "笔记本电脑",
    color: "深空灰",
    configuration: "14 英寸",
    asset: {
      display: "/models/gear/macbook-pro-14-display.glb",
      room: "/models/gear/macbook-pro-14-room.glb",
      preview: "/models/gear/macbook-pro-14-preview.jpg",
      author: "appleyss",
      source:
        "https://sketchfab.com/3d-models/macbook-pro-14-space-gray-95b968f6e3054642be42093ea56f90b8",
      license: "CC BY 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
      modifications:
        "保留 14 英寸深空灰外观，将显示屏调整为深色，并使用 Meshopt 与 WebP 压缩；另制作书房轻量版。",
    },
    gallery: { rotation: [0.12, -0.35, 0], size: 2.15 },
    room: { position: [0, 0.91, -0.09], rotation: [0, 0, 0], size: 0.32 },
  },
  {
    id: "osmo-nano",
    name: "DJI Osmo Nano",
    shortName: "Osmo Nano",
    category: "相机",
    color: "黑色",
    configuration: "相机与图传模块",
    asset: {
      display: "/models/gear/osmo-nano-display.glb",
      room: "/models/gear/osmo-nano-room.glb",
      preview: "/models/gear/osmo-nano-preview.png",
      author: "腾讯混元 3D V3.1",
      source: "https://3d.hunyuan.tencent.com/",
      license: "腾讯混元 3D 服务协议",
      licenseUrl: "https://rule.tencent.com/rule/202501080004",
      modifications:
        "依据 DJI 产品参考图生成；修整为 12 万面展示版与 3.7 万面书房版，并压缩为带 WebP 纹理的 GLB。",
      generated: true,
    },
    gallery: { rotation: [0.12, -0.45, -0.05], size: 2.2 },
    room: { position: [0.5, 0.85, -0.24], rotation: [0, -0.4, 0], size: 0.105 },
  },
];
