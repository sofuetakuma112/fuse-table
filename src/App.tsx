import React, { useState, useCallback, useEffect } from "react";
import { Button, TextField, InputLabel, FormControl, Box } from "@mui/material";
import Papa from "papaparse";
import { Table } from "./components/Table";
import { AddColumnModal } from "./components/Modal";
import { AddRow } from "./components/AddRow";
import { Column } from "./components/Row";
import { SelectShowingColumns } from "./components/SelectShowingColumns";
import { usePrevious } from "./hooks/usePrevious";

import Fuse from "./fuse/entry";
import produce from "immer";

import ExcelJS from "exceljs";

import MenuItem from "@mui/material/MenuItem";
import Select, { SelectChangeEvent } from "@mui/material/Select";

import cloneDeep from "clone-deep";

const sortByIndex = (array: any) =>
  cloneDeep(array).sort((a: any, b: any) => {
    return a.i > b.i ? 1 : -1;
  });

function App() {
  const [headerNames, setHeaderNames] = useState<string[]>([]);
  const [isAddColumnOpen, setIsAddColumnOpen] = useState<boolean>(false);
  const [rows, setRows] = useState<any>([]);
  const [searchWord, setSearchWord] = useState("");
  const [searchTarget, setSearchTarget] = useState<string>("");

  const oldHeaderNames = usePrevious<string[]>(headerNames, []);

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    Papa.parse(e.target.files[0], {
      header: true,
      skipEmptyLines: true,
      complete: (results: any) => {
        const rowsWithIndex = results.data.map((row: any, i: number) => {
          return {
            ...row,
            i,
          };
        });
        setRows(rowsWithIndex);
        setHeaderNames(Object.keys(rowsWithIndex[0]));
      },
    });
  };

  const handleAddRow = (shouldInsertTop: boolean) => {
    setRows((oldRows: any) => {
      let newRows: any[] = [];
      if (shouldInsertTop) {
        const incrementedIndexRows = oldRows.map((row: any) =>
          produce(row, (draft: any) => {
            draft.i += 1;
          })
        );
        newRows = [
          {
            ...headerNames.reduce((obj: any, headerName) => {
              obj[headerName] = "";
              return obj;
            }, {}),
            i: 0,
          },
          ...incrementedIndexRows,
        ];
      } else {
        newRows = [
          ...oldRows,
          {
            ...headerNames.reduce((obj: any, headerName) => {
              obj[headerName] = "";
              return obj;
            }, {}),
            i: oldRows.length,
          },
        ];
      }
      console.log(`newRows.length: ${newRows.length}`);
      return sortByIndex(newRows);
    });
  };

  const handleAddColumn = () => {
    setIsAddColumnOpen(true);
  };

  const handleAddColumnClose = (columnName?: string) => {
    if (columnName && !headerNames.includes(columnName)) {
      setHeaderNames((oldHeaderNames) => [...oldHeaderNames, columnName]);
      setRows((oldRows: any[]) => {
        const objWithNewKey: any = {};
        objWithNewKey[columnName] = "";
        const newRowsForEdit = oldRows.map((oldRow: any) => {
          return {
            ...oldRow,
            ...objWithNewKey,
          };
        });
        return newRowsForEdit;
      });
    }
    setIsAddColumnOpen(false);
  };

  const handlerClickDownloadButton = async () => {
    const workbook = new ExcelJS.Workbook();
    workbook.addWorksheet("sheet1");
    const worksheet = workbook.getWorksheet("sheet1");

    worksheet.columns = headerNames.map((headerName) => ({
      header: headerName,
      key: headerName,
    }));
    worksheet.addRows(sortByIndex(rows));

    const uint8Array = await workbook.csv.writeBuffer();
    const blob = new Blob([uint8Array], { type: "application/octet-binary" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "output.csv";
    a.click();
    a.remove();
  };

  const handleCellInput = useCallback(
    ({ y, x }: { y: number; x: number }, value: string, columns: Column[]) => {
      setRows((oldRows: any) => {
        const newRowsForEdit = produce(oldRows, (draftRows: any) => {
          draftRows[y][columns[x].headerName] = value;
        });
        return newRowsForEdit;
      });
    },
    []
  );

  const handleSearchWordInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchWord(e.target.value);
  };

  useEffect(() => {
    if (!searchWord) {
      console.log("no words");
      try {
        setRows(sortByIndex(rows));
      } catch (e: any) {
        console.log(rows);
        throw Error(e);
      }
      return;
    }
    const options = {
      includeScore: true,
      keys: [searchTarget],
    };
    const fuse = new Fuse(rows, options);
    const result = fuse.search(searchWord);
    setRows(result.map(({ item }: any) => item));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTarget, searchWord]);

  const handleChangeSearchTarget = (e: SelectChangeEvent) => {
    setSearchTarget(e.target.value);
  };

  const [showingHeaderNames, setShowingHeaderNames] = useState<string[]>([]);

  useEffect(() => {
    const newHeaderNames = headerNames.filter(
      (newHeaderName) => !oldHeaderNames.includes(newHeaderName)
    );
    const deletedHeaderNames = oldHeaderNames.filter(
      (newHeaderName) => !headerNames.includes(newHeaderName)
    );
    setShowingHeaderNames((oldShowingHeaderNames) =>
      [...oldShowingHeaderNames, ...newHeaderNames].filter(
        (headerName) => !deletedHeaderNames.includes(headerName)
      )
    );
  }, [headerNames, oldHeaderNames]);

  const handleShowingHeaderNameChecked = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setShowingHeaderNames((oldShowingHeaderNames) => {
      if (oldShowingHeaderNames.includes(value)) {
        // 押されたcheckboxが既にチェック済みの場合
        return oldShowingHeaderNames.filter(
          (headerName) => headerName !== value
        );
      } else {
        return [...oldShowingHeaderNames, value];
      }
    });
  };

  return (
    <div className="App">
      <div className="flex mb-3 mt-3">
        <Button variant="contained" component="label">
          アップロード
          <input type="file" onChange={onFileInputChange} hidden />
        </Button>
        {headerNames.length > 0 && (
          <>
            <Button
              onClick={handlerClickDownloadButton}
              variant="contained"
              component="label"
            >
              ダウンロード
            </Button>
            <AddRow onClose={handleAddRow} />
            <Button
              onClick={handleAddColumn}
              variant="contained"
              component="label"
            >
              列を追加
            </Button>
          </>
        )}
      </div>
      {headerNames.length > 0 && (
        <>
          <div className="flex">
            <TextField
              id="outlined-basic"
              label="検索ワード"
              variant="outlined"
              onChange={handleSearchWordInput}
              value={searchWord}
            />
            <Box sx={{ minWidth: 120 }}>
              <FormControl fullWidth>
                <InputLabel id="demo-simple-select-label">検索対象</InputLabel>
                <Select
                  labelId="demo-simple-select-label"
                  id="demo-simple-select"
                  value={searchTarget}
                  label="検索対象"
                  onChange={handleChangeSearchTarget}
                >
                  {headerNames.map((headerName) => (
                    <MenuItem key={headerName} value={headerName}>
                      {headerName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <SelectShowingColumns
              showingHeaderNames={showingHeaderNames}
              headerNames={headerNames}
              onChecked={handleShowingHeaderNameChecked}
            />
          </div>
          <Table
            headerNames={headerNames}
            showingHeaderNames={showingHeaderNames}
            minCellWidth={120}
            rows={rows}
            onCellInput={handleCellInput}
          />
        </>
      )}
      <AddColumnModal isOpen={isAddColumnOpen} onClose={handleAddColumnClose} />
    </div>
  );
}

export default App;
