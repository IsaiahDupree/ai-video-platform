module.exports=[909270,(a,b,c)=>{"use strict";b.exports=a.r(342602).vendored.contexts.AppRouterContext},738783,(a,b,c)=>{"use strict";b.exports=a.r(342602).vendored["react-ssr"].ReactServerDOMTurbopackClient},346058,(a,b,c)=>{"use strict";function d(a){if("function"!=typeof WeakMap)return null;var b=new WeakMap,c=new WeakMap;return(d=function(a){return a?c:b})(a)}c._=function(a,b){if(!b&&a&&a.__esModule)return a;if(null===a||"object"!=typeof a&&"function"!=typeof a)return{default:a};var c=d(b);if(c&&c.has(a))return c.get(a);var e={__proto__:null},f=Object.defineProperty&&Object.getOwnPropertyDescriptor;for(var g in a)if("default"!==g&&Object.prototype.hasOwnProperty.call(a,g)){var h=f?Object.getOwnPropertyDescriptor(a,g):null;h&&(h.get||h.set)?Object.defineProperty(e,g,h):e[g]=a[g]}return e.default=a,c&&c.set(a,e),e}},739118,(a,b,c)=>{"use strict";Object.defineProperty(c,"__esModule",{value:!0});var d={DEFAULT_SEGMENT_KEY:function(){return l},NOT_FOUND_SEGMENT_KEY:function(){return m},PAGE_SEGMENT_KEY:function(){return k},addSearchParamsIfPageSegment:function(){return i},computeSelectedLayoutSegment:function(){return j},getSegmentValue:function(){return f},getSelectedLayoutSegmentPath:function(){return function a(b,c,d=!0,e=[]){let g;if(d)g=b[1][c];else{let a=b[1];g=a.children??Object.values(a)[0]}if(!g)return e;let h=f(g[0]);return!h||h.startsWith(k)?e:(e.push(h),a(g,c,!1,e))}},isGroupSegment:function(){return g},isParallelRouteSegment:function(){return h}};for(var e in d)Object.defineProperty(c,e,{enumerable:!0,get:d[e]});function f(a){return Array.isArray(a)?a[1]:a}function g(a){return"("===a[0]&&a.endsWith(")")}function h(a){return a.startsWith("@")&&"@children"!==a}function i(a,b){if(a.includes(k)){let a=JSON.stringify(b);return"{}"!==a?k+"?"+a:k}return a}function j(a,b){if(!a||0===a.length)return null;let c="children"===b?a[0]:a[a.length-1];return c===l?null:c}let k="__PAGE__",l="__DEFAULT__",m="/_not-found"},815537,a=>{"use strict";var b=a.i(187924),c=a.i(572131),d=a.i(238246);function e(){let[a,e]=(0,c.useState)("cover"),f={cover:{title:"Cover Mode",description:"Image covers the entire container, cropped to fit",code:`<AdImage
  src="assets/images/hero.jpg"
  objectFit="cover"
  focalPoint={{ x: 0.5, y: 0.5 }}
  width={400}
  height={300}
/>`},contain:{title:"Contain Mode",description:"Entire image visible within container, no cropping",code:`<AdImage
  src="assets/images/logo.png"
  objectFit="contain"
  width={400}
  height={300}
/>`},focalPoint:{title:"Focal Point Positioning",description:"Control which part of the image is visible when cropped",code:`<AdImage
  src="assets/images/portrait.jpg"
  objectFit="cover"
  focalPoint={{ x: 0.7, y: 0.3 }}
  width={400}
  height={400}
/>`},rounded:{title:"Rounded Corners",description:"Apply border radius for rounded or circular images",code:`<AdImage
  src="assets/images/product.jpg"
  objectFit="cover"
  borderRadius={20}
  width={400}
  height={300}
/>`},circle:{title:"Circular Image",description:"Perfect circle with borderRadius={999}",code:`<AdImage
  src="assets/images/profile.jpg"
  objectFit="cover"
  focalPoint={{ x: 0.5, y: 0.3 }}
  borderRadius={999}
  width={300}
  height={300}
/>`},border:{title:"Border & Shadow",description:"Add borders and shadows for depth",code:`<AdImage
  src="assets/images/feature.jpg"
  objectFit="cover"
  borderRadius={16}
  borderWidth={4}
  borderColor="#3b82f6"
  shadow
  width={400}
  height={300}
/>`},opacity:{title:"Opacity Control",description:"Adjust image transparency",code:`<AdImage
  src="assets/images/background.jpg"
  objectFit="cover"
  opacity={0.6}
  width={400}
  height={300}
/>`}};return(0,b.jsxs)("div",{style:{minHeight:"100vh",backgroundColor:"#f9fafb"},children:[(0,b.jsx)("header",{style:{backgroundColor:"white",borderBottom:"1px solid #e5e7eb",padding:"1rem 2rem"},children:(0,b.jsxs)("div",{style:{maxWidth:"1400px",margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"center"},children:[(0,b.jsx)("h1",{style:{fontSize:"1.5rem",fontWeight:"600"},children:"AdImage Component Demo"}),(0,b.jsx)(d.default,{href:"/ads/editor",style:{padding:"0.5rem 1rem",backgroundColor:"#3b82f6",color:"white",borderRadius:"6px",textDecoration:"none",fontSize:"0.875rem"},children:"Back to Editor"})]})}),(0,b.jsxs)("div",{style:{maxWidth:"1400px",margin:"0 auto",padding:"2rem"},children:[(0,b.jsxs)("div",{style:{backgroundColor:"white",borderRadius:"8px",padding:"2rem",marginBottom:"2rem",boxShadow:"0 1px 3px rgba(0,0,0,0.1)"},children:[(0,b.jsx)("h2",{style:{fontSize:"1.25rem",fontWeight:"600",marginBottom:"1rem"},children:"Image Positioning Controls (ADS-006)"}),(0,b.jsx)("p",{style:{color:"#666",marginBottom:"1rem"},children:"The AdImage component provides advanced positioning controls for static ads:"}),(0,b.jsxs)("ul",{style:{color:"#666",paddingLeft:"1.5rem"},children:[(0,b.jsx)("li",{children:"Object fit modes: cover, contain, fill, none"}),(0,b.jsx)("li",{children:"Focal point positioning with x/y coordinates (0-1 range)"}),(0,b.jsx)("li",{children:"Border radius for rounded corners and circular images"}),(0,b.jsx)("li",{children:"Border width and color customization"}),(0,b.jsx)("li",{children:"Shadow effects with custom styles"}),(0,b.jsx)("li",{children:"Opacity control for overlays"})]})]}),(0,b.jsx)("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(350px, 1fr))",gap:"1.5rem",marginBottom:"2rem"},children:Object.entries(f).map(([c,d])=>(0,b.jsxs)("div",{onClick:()=>e(c),style:{backgroundColor:"white",borderRadius:"8px",padding:"1.5rem",boxShadow:"0 1px 3px rgba(0,0,0,0.1)",cursor:"pointer",border:a===c?"2px solid #3b82f6":"2px solid transparent",transition:"all 0.2s"},children:[(0,b.jsx)("h3",{style:{fontSize:"1.125rem",fontWeight:"600",marginBottom:"0.5rem",color:a===c?"#3b82f6":"#111"},children:d.title}),(0,b.jsx)("p",{style:{color:"#666",fontSize:"0.875rem",marginBottom:"1rem"},children:d.description}),(0,b.jsx)("div",{style:{width:"100%",height:"150px",backgroundColor:"#f3f4f6",borderRadius:"8px",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:"1rem",overflow:"hidden",position:"relative"},children:(0,b.jsx)("div",{style:{width:"100%",height:"100%",background:"linear-gradient(135deg, #667eea 0%, #764ba2 100%)",..."rounded"===c&&{borderRadius:"20px"},..."circle"===c&&{borderRadius:"50%",width:"150px",height:"150px"},..."border"===c&&{border:"4px solid #3b82f6",borderRadius:"16px",boxShadow:"0 4px 20px rgba(0, 0, 0, 0.15)"},..."opacity"===c&&{opacity:.6},..."contain"===c&&{width:"80%",height:"80%",margin:"auto"}}})}),(0,b.jsx)("pre",{style:{backgroundColor:"#1f2937",color:"#d1d5db",padding:"1rem",borderRadius:"6px",fontSize:"0.75rem",overflow:"auto",margin:0},children:(0,b.jsx)("code",{children:d.code})})]},c))}),(0,b.jsxs)("div",{style:{backgroundColor:"white",borderRadius:"8px",padding:"2rem",boxShadow:"0 1px 3px rgba(0,0,0,0.1)"},children:[(0,b.jsx)("h2",{style:{fontSize:"1.25rem",fontWeight:"600",marginBottom:"1rem"},children:"Implementation Guide"}),(0,b.jsx)("h3",{style:{fontSize:"1rem",fontWeight:"600",marginBottom:"0.5rem",marginTop:"1.5rem"},children:"Import"}),(0,b.jsx)("pre",{style:{backgroundColor:"#1f2937",color:"#d1d5db",padding:"1rem",borderRadius:"6px",fontSize:"0.875rem",overflow:"auto"},children:(0,b.jsx)("code",{children:"import { AdImage, FocalPoints } from '@/components/AdImage';"})}),(0,b.jsx)("h3",{style:{fontSize:"1rem",fontWeight:"600",marginBottom:"0.5rem",marginTop:"1.5rem"},children:"Focal Point Presets"}),(0,b.jsx)("pre",{style:{backgroundColor:"#1f2937",color:"#d1d5db",padding:"1rem",borderRadius:"6px",fontSize:"0.875rem",overflow:"auto"},children:(0,b.jsx)("code",{children:`FocalPoints.CENTER        // { x: 0.5, y: 0.5 }
FocalPoints.TOP_LEFT      // { x: 0, y: 0 }
FocalPoints.TOP_CENTER    // { x: 0.5, y: 0 }
FocalPoints.TOP_RIGHT     // { x: 1, y: 0 }
FocalPoints.CENTER_LEFT   // { x: 0, y: 0.5 }
FocalPoints.CENTER_RIGHT  // { x: 1, y: 0.5 }
FocalPoints.BOTTOM_LEFT   // { x: 0, y: 1 }
FocalPoints.BOTTOM_CENTER // { x: 0.5, y: 1 }
FocalPoints.BOTTOM_RIGHT  // { x: 1, y: 1 }`})}),(0,b.jsx)("h3",{style:{fontSize:"1rem",fontWeight:"600",marginBottom:"0.5rem",marginTop:"1.5rem"},children:"Helper Functions"}),(0,b.jsx)("pre",{style:{backgroundColor:"#1f2937",color:"#d1d5db",padding:"1rem",borderRadius:"6px",fontSize:"0.875rem",overflow:"auto"},children:(0,b.jsx)("code",{children:`// Create focal point from percentages
createFocalPoint(70, 30); // { x: 0.7, y: 0.3 }

// Create focal point from pixel coordinates
createFocalPointFromPixels(800, 400, 1920, 1080);`})})]})]})]})}a.s(["default",()=>e])}];

//# sourceMappingURL=_6248d620._.js.map