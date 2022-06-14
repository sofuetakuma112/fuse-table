import React, { useState, useCallback } from "react";
import { Button, TextField, InputLabel, FormControl, Box } from "@mui/material";
import Papa from "papaparse";
import { Table } from "./components/Table";
import { AddColumnModal } from "./components/Modal";
import { AddRow } from "./components/AddRow";
import { Column } from "./components/Row";

import Fuse from "./fuse/entry";
import produce from "immer";

import ExcelJS from "exceljs";

import MenuItem from "@mui/material/MenuItem";
import Select, { SelectChangeEvent } from "@mui/material/Select";

const sortByIndex = (array: any) =>
  array.sort((a: any, b: any) => {
    return a.i > b.i ? 1 : -1;
  });

function App() {
  const [headerNames, setHeaderNames] = useState<string[]>([]);

  const [isAddColumnOpen, setIsAddColumnOpen] = useState<boolean>(false);

  const [rowsForEdit, setRowsForEdit] = useState<any>([]);

  const [searchWord, setSearchWord] = useState("");

  const [searchTarget, setSearchTarget] = useState<string>("");

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
        setRowsForEdit(rowsWithIndex);
        setHeaderNames(Object.keys(rowsWithIndex[0]));
      },
    });
  };

  const handleAddRow = (shouldInsertTop: boolean) => {
    setRowsForEdit((oldRows: any) => {
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
      return sortByIndex(newRows);
    });
  };

  const handleAddColumn = () => {
    setIsAddColumnOpen(true);
  };

  const handleAddColumnClose = (columnName?: string) => {
    if (columnName && !headerNames.includes(columnName)) {
      setHeaderNames((oldHeaderNames) => [...oldHeaderNames, columnName]);
      setRowsForEdit((oldRows: any[]) => {
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
    worksheet.addRows(rowsForEdit);

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
    (
      { y, x }: { y: number; x: number },
      value: string,
      columns: Column[]
    ) => {
      setRowsForEdit((oldRows: any) => {
        console.log(`handleCellInput: (${x}, ${y})`);
        const newRowsForEdit = produce(oldRows, (draftRows: any) => {
          draftRows[y][columns[x].headerName] = value;
        });
        console.log(`newRowsForEdit: ${newRowsForEdit}`);
        return newRowsForEdit;
      });
    },
    []
  );

  const handleSearchWordInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchWord(e.target.value);
    if (!e.target.value) {
      setRowsForEdit(sortByIndex(rowsForEdit));
      return;
    }
    const options = {
      includeScore: true,
      keys: [searchTarget],
    };
    const fuse = new Fuse(rowsForEdit, options);
    const result = fuse.search(e.target.value);
    setRowsForEdit(result.map(({ item }: any) => item));
  };

  const handleChangeSearchTarget = (e: SelectChangeEvent) => {
    setSearchTarget(e.target.value);
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
          </div>
          <Table
            headerNames={headerNames}
            minCellWidth={120}
            rows={rowsForEdit}
            onCellInput={handleCellInput}
          />
        </>
      )}
      <AddColumnModal isOpen={isAddColumnOpen} onClose={handleAddColumnClose} />
    </div>
  );
}

export default App;
