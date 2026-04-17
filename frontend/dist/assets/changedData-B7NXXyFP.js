const s=(o,e,n,p="user_image")=>{const a=new FormData;return Object.entries(e).forEach(([r,t])=>{o[r]!==t&&t!==void 0&&t!==null&&a.append(r,t)}),n&&a.append(p,n),a};export{s as g};
