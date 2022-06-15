import {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
  createRef,
} from "react";
import "./styles.css";
import { range } from "../../utils/util";
import { Row, Column } from "../Row";

type Props = {
  headerNames: string[];
  showingHeaderNames: string[];
  minCellWidth: number;
  rows: any;
  onCellInput(
    { y, x }: { y: number; x: number },
    value: string,
    columns: Column[]
  ): void;
};

/*
 * Read the blog post here:
 * https://letsbuildui.dev/articles/resizable-tables-with-react-and-css-grid
 */
const Table: React.FC<Props> = ({
  headerNames,
  showingHeaderNames,
  minCellWidth,
  rows,
  onCellInput,
}) => {
  // カラムのリサイズハンドルの高さを決定するために使用します
  const [tableHeight, setTableHeight] = useState<string | number>("auto");
  // 現在リサイズされているカラムのインデックスを格納します
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  
  const tableElement = useRef<HTMLTableElement>(null); // useRefフックの初期値にnullを与えると、戻り値のrefオブジェクトは読み取り専用です。つまり、currentプロパティは書き替えられません。

  const refs = useRef<React.RefObject<HTMLTableHeaderCellElement>[]>([]);
  const columns = useMemo(
    () =>
      showingHeaderNames.map((headerName: string, index: number) => {
        refs.current[index] = createRef<HTMLTableHeaderCellElement>();
        return {
          refIndex: index,
          headerName,
        };
      }),
    [showingHeaderNames]
  );

  const onCellInputAssignedColumns = useCallback(
    ({ y, x }: { y: number; x: number }, value: string) =>
      onCellInput({ y, x }, value, columns),
    [columns, onCellInput]
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

      const gridColumns = columns.map(({ refIndex }, i) => {
        const th = refs.current[refIndex];
        if (!th) throw Error("th is falsy");
        if (i === activeIndex) {
          // カラムのindexとactiveIndexが一致する
          const width = e.clientX - (th as any).offsetLeft; // 列の幅を取得

          if (width >= minCellWidth) {
            return `${width}px`; // この幅がminCellWidthプロパティの値以上であれば、新しい幅を返します。
          }
        }
        return `${(th as any).offsetWidth}px`; // それ以外の場合は、以前の幅を返す。
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

  if (rows[0].i === 0) {
    console.log(rows[0]);
  }

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
              {columns.map(({ refIndex, headerName }, i) => (
                <th ref={refs.current[refIndex]} key={headerName}>
                  {/* spanタグ内にテキストを配置するのは、セルの幅を超えるコンテンツを切り取り、切り取られたコンテンツには省略記号を表示するため */}
                  <span>{headerName}</span>
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
            {rows.map((row: any) => (
              <Row
                key={row.i}
                y={row.i}
                row={row}
                columns={columns}
                onCellInput={onCellInputAssignedColumns}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export { Table };
