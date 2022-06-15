import * as React from "react";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";

const label = { inputProps: { "aria-label": "Checkbox demo" } };

type Props = {
  headerNames: string[];
  showingHeaderNames: string[];
  onChecked(e: React.ChangeEvent<HTMLInputElement>): void;
};

export const SelectShowingColumns: React.FC<Props> = ({
  headerNames,
  showingHeaderNames,
  onChecked,
}) => {
  return (
    <div>
      <FormGroup row>
        {headerNames.map((headerName) => (
          <FormControlLabel
            key={headerName}
            control={
              <Checkbox
                value={headerName}
                checked={showingHeaderNames.includes(headerName)}
                {...label}
                onChange={onChecked}
              />
            }
            label={headerName}
          />
        ))}
      </FormGroup>
    </div>
  );
};
