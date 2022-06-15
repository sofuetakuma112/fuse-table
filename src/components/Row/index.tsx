import React from "react";
import { Cell } from "../Cell";

export type Column = {
  headerName: string;
  refIndex: number;
}

type Props = {
  y: number;
  row: any;
  columns: Column[];
  onCellInput({ y, x }: { y: number; x: number }, value: string): void;
};

const Row: React.FC<Props> = ({ y, row, columns, onCellInput }) => {
  // console.log(`Row(): (, ${y})`)
  // if (row.i === 0) {
  //   console.log(row)
  // }

  return (
    <tr>
      {columns.map(({ headerName }, x: number) => (
        <Cell
          key={x}
          x={x}
          y={y}
          value={row[headerName]}
          onCellInput={onCellInput}
        />
      ))}
    </tr>
  );
};

export { Row };
