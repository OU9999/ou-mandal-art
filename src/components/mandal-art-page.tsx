import { useRef } from "react";
import { BoxGlowLayer } from "./box-glow-layer";
import { ThermalBackground } from "./thermal-background";
import { MandalCellsProvider } from "./mandal-art-page/_components/mandal-cells-provider";
import { MandalLayout } from "./mandal-art-page/_components/mandal-layout";
import { MandalHeader } from "./mandal-art-page/_components/mandal-header";
import { MandalActions } from "./mandal-art-page/_components/mandal-actions";
import { MandalWorkspace } from "./mandal-art-page/_components/mandal-workspace";
import { MandalExport } from "./mandal-art-page/_components/mandal-export";
import { MandalBoard } from "./mandal-art-page/_components/mandal-board";
import { MandalBox } from "./mandal-art-page/_components/mandal-box";
import { MandalStatus } from "./mandal-art-page/_components/mandal-status";
import { useMandalExport } from "./mandal-art-page/_hooks/use-mandal-export";

const MandalArtPage = () => {
  const exportRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const exportImage = useMandalExport(exportRef);

  return (
    <MandalCellsProvider>
      <MandalLayout>
        <ThermalBackground />
        <MandalHeader />
        <MandalActions onExport={exportImage} />
        <MandalWorkspace>
          <MandalExport ref={exportRef}>
            <MandalBoard ref={boardRef}>
              <BoxGlowLayer boardRef={boardRef} />
              <MandalBox boardIndex={0} />
              <MandalBox boardIndex={1} />
              <MandalBox boardIndex={2} />
              <MandalBox boardIndex={3} />
              <MandalBox boardIndex={4} />
              <MandalBox boardIndex={5} />
              <MandalBox boardIndex={6} />
              <MandalBox boardIndex={7} />
              <MandalBox boardIndex={8} />
            </MandalBoard>
          </MandalExport>
        </MandalWorkspace>
        <MandalStatus />
      </MandalLayout>
    </MandalCellsProvider>
  );
};

export { MandalArtPage };
