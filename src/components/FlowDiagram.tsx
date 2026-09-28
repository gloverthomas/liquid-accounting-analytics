import type { FlowDiagram as Flow } from "../../shared/contracts";
import { flowLayers } from "../../shared/flow";

/** A top-to-bottom mechanism flow. A straight sequence is one stage per row. */
export function FlowDiagram({ diagram }: { diagram: Flow }) {
  const rows = flowLayers(diagram);
  let step = 0;
  return (
    <figure className="flow" aria-label={diagram.title}>
      <figcaption className="chart-head">
        <span className="chart-title">{diagram.title}</span>
        <span className="chart-sub">Flow</span>
      </figcaption>
      <ol className="flow-layers">
        {rows.map((row, index) => (
          <li key={row.map((node) => node.id).join("-")} className="flow-layer">
            {index > 0 ? <span className="flow-join" aria-hidden="true" /> : null}
            <div className="flow-row">
              {row.map((node) => {
                step += 1;
                return (
                  <div key={node.id} className="flow-node">
                    <span className="flow-index" aria-hidden="true">
                      {step}
                    </span>
                    {node.label}
                  </div>
                );
              })}
            </div>
          </li>
        ))}
      </ol>
    </figure>
  );
}
