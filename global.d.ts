declare module '*.css' {
    const content: { [className: string]: string };
    export default content;
  }

// global.d.ts
declare module "*.png";
declare module "*.svg";
declare module "*.jpeg";
declare module "*.jpg";
