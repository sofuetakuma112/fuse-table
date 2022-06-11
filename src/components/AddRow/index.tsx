import React, { useCallback } from "react";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";

type Props = {
  onClose(shouldInsertTop: boolean): void;
};

export const AddRow: React.FC<Props> = ({ onClose }) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = useCallback((shouldInsertTop: boolean = false) => {
    onClose(shouldInsertTop);
    setAnchorEl(null);
  }, [onClose]);

  return (
    <div>
      <Button
        id="basic-button"
        aria-controls={open ? "basic-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        onClick={handleClick}
        variant="contained"
      >
        行を追加
      </Button>
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        MenuListProps={{
          "aria-labelledby": "basic-button",
        }}
      >
        <MenuItem onClick={() => handleClose(true)}>先頭に追加</MenuItem>
        <MenuItem onClick={() => handleClose()}>末尾に追加</MenuItem>
      </Menu>
    </div>
  );
};
