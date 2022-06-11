import React, { useState } from "react";
import {
  TextField,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";

type Props = {
  isOpen: boolean;
  onClose(columnName?: string): void;
};

const AddColumnModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [columnName, setColumnName] = useState("");

  return (
    <Dialog
      open={isOpen}
      onClose={() => onClose()}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title">{"カラム追加"}</DialogTitle>
      <DialogContent>
        {/* <DialogContentText id="alert-dialog-description">
          Let Google help apps determine location. This means sending anonymous
          location data to Google, even when no apps are running.
        </DialogContentText> */}
        <TextField
          id="outlined-basic"
          label="カラム名"
          variant="outlined"
          value={columnName}
          onChange={(e) => setColumnName(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose()}>キャンセル</Button>
        <Button onClick={() => onClose(columnName)} autoFocus>
          追加
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export { AddColumnModal };
