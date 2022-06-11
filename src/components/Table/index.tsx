import { useState, useCallback, useEffect, useRef } from "react";
import { TextField } from "@mui/material";
import "./styles.css";

const createHeaders = (
  headers: string[],
  refs: React.RefObject<HTMLTableHeaderCellElement>[]
) => {
  return headers.map((item: string, i: number) => ({
    text: item,
    ref: refs[i], // tableHeightの取得と、後でテーブルのヘッダーセルに正しい幅を適用するのに使用する
  }));
};

const createRefs = (size: number) =>
  range(size).map(() => useRef<HTMLTableHeaderCellElement>(null));

const range = (length: number) => Array.from({ length }, (v, k) => k);

type Props = {
  headerNames: string[];
  minCellWidth: number;
  rows: any;
  onCellInput(
    e: React.ChangeEvent<HTMLInputElement>,
    i: number,
    j: number,
    columns: {
      text: string;
      ref: React.RefObject<HTMLTableHeaderCellElement>;
    }[]
  ): void;
};

/*
 * Read the blog post here:
 * https://letsbuildui.dev/articles/resizable-tables-with-react-and-css-grid
 */
const Table: React.FC<Props> = ({
  headerNames,
  minCellWidth,
  rows,
  onCellInput,
}) => {
  // カラムのリサイズハンドルの高さを決定するために使用します
  const [tableHeight, setTableHeight] = useState<string | number>("auto");
  // 現在リサイズされているカラムのインデックスを格納します
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const tableElement = useRef<HTMLTableElement>(null); // useRefフックの初期値にnullを与えると、戻り値のrefオブジェクトは読み取り専用です。つまり、currentプロパティは書き替えられません。

  const refs = createRefs(10);
  const columns = createHeaders(
    headerNames.filter((headerName) => headerName !== "i"),
    refs
  );

  useEffect(() => {
    if (!tableElement.current) return;
    setTableHeight(tableElement.current.offsetHeight);
  }, []);

  // ハンドルをクリックしたときに実行される
  const mouseDown = (index: number) => {
    setActiveIndex(index);
  };

  const mouseMove = useCallback(
    (e: MouseEvent) => {
      const table = tableElement.current;
      if (!table) throw Error("table is falsy");

      const gridColumns = columns.map((col, i) => {
        const th = col.ref.current;
        if (!th) throw Error("th is falsy");
        if (i === activeIndex) {
          // カラムのindexとactiveIndexが一致する
          const width = e.clientX - th.offsetLeft; // 列の幅を取得

          if (width >= minCellWidth) {
            return `${width}px`; // この幅がminCellWidthプロパティの値以上であれば、新しい幅を返します。
          }
        }
        return `${th.offsetWidth}px`; // それ以外の場合は、以前の幅を返す。
      });

      table.style.gridTemplateColumns = `${gridColumns.join(" ")}`;
    },
    [activeIndex, columns, minCellWidth]
  );

  // ハンドルを操作しているときと、ハンドルを離した際のクリーンアップ用の処理をイベントハンドラにセットする
  const removeListeners = useCallback(() => {
    window.removeEventListener("mousemove", mouseMove);
    window.removeEventListener("mouseup", removeListeners);
  }, [mouseMove]);

  // mouseUp 関数は、activeIndex 状態の値を解除し、イベントリスナーを削除する関数を呼び出します。
  // そうしないと、列のリサイズが止まりません。
  const mouseUp = useCallback(() => {
    setActiveIndex(null);
    removeListeners();
  }, [setActiveIndex, removeListeners]);

  // activeIndex の値が null でない場合は、mouseMove と mouseUp という二つの新しいリスナーを追加する
  useEffect(() => {
    if (activeIndex !== null) {
      window.addEventListener("mousemove", mouseMove);
      window.addEventListener("mouseup", mouseUp);
    }

    return () => {
      removeListeners();
    };
  }, [activeIndex, mouseMove, mouseUp, removeListeners]);

  // Demo only
  // const resetTableCells = () => {
  //   if (!tableElement.current) return;
  //   tableElement.current.style.gridTemplateColumns = "";
  // };

  return (
    <div className="container">
      <div className="table-wrapper">
        <table
          className="resizeable-table"
          style={{
            gridTemplateColumns: `${range(columns.length)
              .map((_) => `${Math.floor(100 / columns.length)}%`)
              .join(" ")}`,
          }}
          ref={tableElement}
        >
          <thead>
            <tr>
              {columns.map(({ ref, text }, i) => (
                <th ref={ref} key={text}>
                  {/* spanタグ内にテキストを配置するのは、セルの幅を超えるコンテンツを切り取り、切り取られたコンテンツには省略記号を表示するため */}
                  <span>{text}</span>
                  <div
                    style={{ height: tableHeight }}
                    onMouseDown={() => mouseDown(i)}
                    className={`resize-handle ${
                      activeIndex === i ? "active" : "idle"
                    }`}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row: any, i: number) => (
              <tr key={i}>
                {columns.map(({ text: headerName }, j: number) => (
                  <td key={j}>
                    <TextField
                      value={row[headerName]}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        onCellInput(e, i, j, columns)
                      }
                      fullWidth
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* <button onClick={resetTableCells}>Reset</button> */}
    </div>
  );
};

export { Table };
