import React, { useEffect, useState } from "react";
import "./App.css";
import { Button, TextField } from "@mui/material";
import Papa from "papaparse";
import { Table } from "./components/Table";
import { AddColumnModal } from "./components/Modal";

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
        setRows(results.data);
      },
    });
  };

  const [isAddColumnOpen, setIsAddColumnOpen] = useState<boolean>(false);

  const handleAddRow = () => {};

  const handleAddColumn = () => {
    setIsAddColumnOpen(true);
  };

  const handleAddColumnClose = (columnName?: string) => {
    if (columnName && !headerNames.includes(columnName)) {
      setHeaderNames((oldHeaderNames) => [...oldHeaderNames, columnName]);
    }
    setIsAddColumnOpen(false);
  };

  return (
    <div className="App">
      <Button variant="contained" component="label">
        Upload File
        <input type="file" onChange={onFileInputChange} hidden />
      </Button>
      {headerNames.length > 0 && (
        <>
          <Button onClick={handleAddRow} variant="contained" component="label">
            Add Row
          </Button>
          <Button
            onClick={handleAddColumn}
            variant="contained"
            component="label"
          >
            Add Column
          </Button>
          <Table headers={headerNames} minCellWidth={120} rows={rows} />
        </>
      )}
      <AddColumnModal isOpen={isAddColumnOpen} onClose={handleAddColumnClose} />
    </div>
  );
}

export default App;
