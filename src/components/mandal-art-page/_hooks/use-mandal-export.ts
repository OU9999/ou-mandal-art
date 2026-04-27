import type { RefObject } from "react";
import { toPng } from "html-to-image";

const useMandalExport = (targetRef: RefObject<HTMLDivElement | null>) => {
  const exportImage = async () => {
    const node = targetRef.current;
    if (!node) return;

    const dataUrl = await toPng(node, {
      backgroundColor: "#02030a",
      cacheBust: true,
      pixelRatio: 2,
    });
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = "mandal-art.png";
    link.click();
  };

  return exportImage;
};

export { useMandalExport };
