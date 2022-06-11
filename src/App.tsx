import React, { useEffect, useState } from "react";
import "./App.css";
import { Button, TextField } from "@mui/material";
import Papa from "papaparse";
import { Table } from "./components/Table";
import { AddColumnModal } from "./components/Modal";

import Fuse from "./fuse/entry";
import produce from "immer";

function App() {
  const [rows, setRows] = useState([]);
  const [headerNames, setHeaderNames] = useState<string[]>([]);

  useEffect(() => {
    if (!rows) return;
    if (rows.length === 0) return;
    setHeaderNames(Object.keys(rows[0]));
  }, [rows]);

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
      },
    });
  };

  const [isAddColumnOpen, setIsAddColumnOpen] = useState<boolean>(false);

  const handleAddRow = () => {
    setRowsForEdit((oldRows: any) => [
      {
        ...headerNames.reduce((obj: any, headerName) => {
          obj[headerName] = "";
          return obj;
        }, {}),
        i: oldRows.length + 1,
      },
      ...oldRows,
    ]);
  };

  const handleAddColumn = () => {
    setIsAddColumnOpen(true);
  };

  const handleAddColumnClose = (columnName?: string) => {
    if (columnName && !headerNames.includes(columnName)) {
      setHeaderNames((oldHeaderNames) => [...oldHeaderNames, columnName]);
    }
    setIsAddColumnOpen(false);
  };

  //
  //
  //

  const [rowsForEdit, setRowsForEdit] = useState<any>([]);

  useEffect(() => {
    if (!rowsForEdit || !rowsForEdit.length) return;
    const noExistKeys = headerNames.filter(
      (headerName) => !Object.keys(rowsForEdit[0]).includes(headerName)
    );
    if (!noExistKeys.length) return;
    setRowsForEdit((oldRows: any[]) => {
      const newRowsForEdit = oldRows.map((oldRow: any) => {
        // const noExistKeys = headerNames.filter(
        //   (headerName) => !Object.keys(oldRow).includes(headerName)
        // );
        return {
          ...oldRow,
          ...noExistKeys.reduce((obj: any, noExistKey) => {
            obj[noExistKey] = "";
            return obj;
          }, {}),
        };
      });
      return newRowsForEdit;
    });
  }, [headerNames, rowsForEdit]);

  useEffect(() => {
    setRowsForEdit(rows.slice());
  }, [rows]);

  const handleCellInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    i: number,
    j: number,
    columns: {
      text: string;
      ref: React.RefObject<HTMLTableHeaderCellElement>;
    }[]
  ) => {
    setRowsForEdit((oldRows: any) => {
      const newRowsForEdit = produce(oldRows, (draft: any) => {
        draft[i][columns[j].text] = e.target.value;
      });
      setRowsForSearch(newRowsForEdit);
      // console.log(newRowsForEdit);
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
    <div className="App">
      <div>
        <Button variant="contained" component="label">
          Upload File
          <input type="file" onChange={onFileInputChange} hidden />
        </Button>
        {headerNames.length > 0 && (
          <>
            <Button
              onClick={handleAddRow}
              variant="contained"
              component="label"
            >
              Add Row
            </Button>
            <Button
              onClick={handleAddColumn}
              variant="contained"
              component="label"
            >
              Add Column
            </Button>
          </>
        )}
      </div>
      {headerNames.length > 0 && (
        <>
          <TextField
            id="outlined-basic"
            label="Outlined"
            variant="outlined"
            onChange={handleSearchWordInput}
            value={searchWord}
          />
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
