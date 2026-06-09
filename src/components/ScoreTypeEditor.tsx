import type { ScoreRuleKey, ScoreType, ScoringConfig } from "../domain/bingoTypes";

type ScoreTypeEditorProps = {
  value: ScoringConfig;
  onChange: (value: ScoringConfig) => void;
};

const ruleLabels: Array<{ key: ScoreRuleKey; label: string }> = [
  { key: "markedCell", label: "Casilla" },
  { key: "completedLine", label: "Linea" },
  { key: "completedBingo", label: "Bingo" },
  { key: "wildcardUsed", label: "Comodin" },
];

export function ScoreTypeEditor({ value, onChange }: ScoreTypeEditorProps) {
  function updateScoreType(scoreTypeId: string, patch: Partial<ScoreType>) {
    onChange({
      ...value,
      scoreTypes: value.scoreTypes.map((scoreType) =>
        scoreType.id === scoreTypeId ? { ...scoreType, ...patch } : scoreType,
      ),
    });
  }

  function updateRule(
    ruleKey: ScoreRuleKey,
    scoreTypeId: string,
    rawValue: string,
  ) {
    const parsedValue = Number(rawValue);
    onChange({
      ...value,
      rules: {
        ...value.rules,
        [ruleKey]: {
          ...value.rules[ruleKey],
          [scoreTypeId]: Number.isFinite(parsedValue) ? parsedValue : 0,
        },
      },
    });
  }

  return (
    <section className="editor-panel">
      <div className="panel-title-row">
        <h2>Puntuacion</h2>
      </div>

      <label className="toggle-row">
        <input
          type="checkbox"
          checked={value.enabled !== false}
          onChange={(event) =>
            onChange({ ...value, enabled: event.target.checked })
          }
        />
        Usar puntos en este bingo
      </label>

      <label className="toggle-row">
        <input
          type="checkbox"
          checked={value.includeDiagonals}
          onChange={(event) =>
            onChange({ ...value, includeDiagonals: event.target.checked })
          }
        />
        Contar diagonales como lineas
      </label>

      {value.enabled !== false ? (
        <>
          <div className="score-type-list">
            {value.scoreTypes.map((scoreType) => (
              <div className="score-type-row" key={scoreType.id}>
                <input
                  type="text"
                  value={scoreType.name}
                  onChange={(event) =>
                    updateScoreType(scoreType.id, { name: event.target.value })
                  }
                  aria-label="Nombre de puntuacion"
                  placeholder="Nombre de la puntuacion"
                />
                <span className="score-type-icon-badge">
                  {scoreType.icon || "pts"}
                </span>
              </div>
            ))}
          </div>

          <div className="score-table-wrap">
            <table className="score-table">
              <thead>
                <tr>
                  <th>Evento</th>
                  {value.scoreTypes.map((scoreType) => (
                    <th key={scoreType.id}>{scoreType.name || "Sin nombre"}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ruleLabels.map((rule) => (
                  <tr key={rule.key}>
                    <td>{rule.label}</td>
                    {value.scoreTypes.map((scoreType) => (
                      <td key={scoreType.id}>
                        <input
                          type="number"
                          value={value.rules[rule.key][scoreType.id] ?? 0}
                          onChange={(event) =>
                            updateRule(rule.key, scoreType.id, event.target.value)
                          }
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <p className="score-disabled-note">
          Las partidas se guardaran sin calcular puntos.
        </p>
      )}
    </section>
  );
}
