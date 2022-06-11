import { useState, useCallback, useEffect, useRef } from "react";
import { TextField } from "@mui/material";
import "./styles.css";
import Fuse from "../../fuse/entry";
import produce from "immer";

const createHeaders = (headers: string[]) => {
  return headers.map((item: string) => ({
    text: item,
    ref: useRef<HTMLTableHeaderCellElement>(null),
  }));
};

const range = (length: number) => Array.from({ length }, (v, k) => k);

type Props = {
  headers: string[];
  minCellWidth: number;
  rows: any;
};

/*
 * Read the blog post here:
 * https://letsbuildui.dev/articles/resizable-tables-with-react-and-css-grid
 */
const Table: React.FC<Props> = ({ headers, minCellWidth, rows }) => {
  const [tableHeight, setTableHeight] = useState<string | number>("auto");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const [rowsForEdit, setRowsForEdit] = useState<any>([]);

  // const rowsForSearch = useMemo(() => {}, []);
  const tableElement = useRef<HTMLTableElement>(null); // useRefフックの初期値にnullを与えると、戻り値のrefオブジェクトは読み取り専用です。つまり、currentプロパティは書き替えられません。
  const columns = createHeaders(headers);

  useEffect(() => {
    if (!tableElement.current) return;
    setTableHeight(tableElement.current.offsetHeight);
  }, []);

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
          const width = e.clientX - th.offsetLeft;

          if (width >= minCellWidth) {
            return `${width}px`;
          }
        }
        return `${th.offsetWidth}px`;
      });

      table.style.gridTemplateColumns = `${gridColumns.join(" ")}`;
    },
    [activeIndex, columns, minCellWidth]
  );

  const removeListeners = useCallback(() => {
    window.removeEventListener("mousemove", mouseMove);
    window.removeEventListener("mouseup", removeListeners);
  }, [mouseMove]);

  const mouseUp = useCallback(() => {
    setActiveIndex(null);
    removeListeners();
  }, [setActiveIndex, removeListeners]);

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

  useEffect(() => {
    setRowsForEdit(rows.slice());
  }, [rows]);

  const handleCellInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    i: number,
    j: number
  ) => {
    setRowsForEdit((oldRows: any) => {
      const newRowsForEdit = produce(oldRows, (draft: any) => {
        draft[i][columns[j].text] = e.target.value;
      });
      setRowsForSearch(newRowsForEdit);
      return newRowsForEdit;
    });
  };

  const [searchWord, setSearchWord] = useState("");
  const [rowsForSearch, setRowsForSearch] = useState<any>([]);
  const handleSearchWordInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchWord(e.target.value);
    if (!e.target.value) {
      // rowsForSearchは常に最新の入力状態のセルデータを持つ
      setRowsForEdit(rowsForSearch);
      return;
    }
    const options = {
      includeScore: true,
      keys: ["content"],
    };
    const fuse = new Fuse(rowsForSearch, options);
    const result = fuse.search(e.target.value).sort((a: any, b: any) => {
      if (!a?.score && !b?.score) return 0;
      if (!a?.score) return 1;
      if (!b?.score) return -1;
      return a.score > b.score ? -1 : 1;
    });
    setRowsForEdit(result.map(({ item }: any) => item));
  };

  return (
    <div className="container">
      <TextField
        id="outlined-basic"
        label="Outlined"
        variant="outlined"
        onChange={handleSearchWordInput}
        value={searchWord}
      />
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
            {rowsForEdit.map((row: any, i: number) => (
              <tr key={i}>
                {columns.map(({ text: headerName }, j: number) => (
                  <td key={j}>
                    <TextField
                      value={row[headerName]}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleCellInput(e, i, j)
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
