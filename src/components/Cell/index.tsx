import React, { useState, useCallback } from "react";
import { TextField } from "@mui/material";

type Props = {
  x: number;
  y: number;
  value: string;
  onCellInput({ y, x }: { y: number; x: number }, value: string): void;
};

const Cell: React.FC<Props> = React.memo(
  ({ x, y, value: propsValue, onCellInput }) => {
    console.log(`Cell(): (${x}, ${y})`)

    const [value, setValue] = useState(propsValue);

    const hasNewValue = useCallback(
      (value: string) => {
        onCellInput({ x, y }, value);;
        // setEditing(false);
      },
      [onCellInput, x, y]
    );

    const onBlur = useCallback(
      (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement, Element>) => {
        hasNewValue(e.target.value);
      },
      [hasNewValue]
    );

    return (
      <td>
        <TextField
          value={value}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setValue(e.target.value);
          }}
          onBlur={onBlur}
          fullWidth
        />
      </td>
    );
  }
);

export { Cell };
