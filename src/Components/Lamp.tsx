import { useExecuteAction } from 'container/DeviceContainer';
import BlinkenlightPopup from './BlinkenlightPopup';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Tooltip from '@material-ui/core/Tooltip';
import useStyles from './Lamp.style';

const TooltipImg = ({ tooltip, ...props }: any) => (
  <Tooltip placement="top" title={tooltip}>
    <img {...props} />
  </Tooltip>
);

export interface Lamp {
  status_text?: string;
  rate_delay: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  name: string;
  type: string;
  status: 0 | 1;
  duplicates?: Lamp[];
  layer: string;
  image: string;
  is_writable: number;
}

interface Props {
  lamp: Lamp;
}

const LampComponent = ({ lamp }: Props) => {
  const executeAction = useExecuteAction();
  const classes = useStyles();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [forceRerender, setForceRerender] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | undefined;

    if (lamp.rate_delay > 0) {
      timeoutId = setTimeout(() => {
        lamp.rate_delay -= 1;
        setForceRerender((old) => !old);
      }, 1000);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [lamp, forceRerender]);

  const style = {
    left: lamp.x1,
    top: lamp.y1,
    width: lamp.x2,
    height: lamp.y2,
  };

  let cssClass = classes.lamp;

  if (lamp.is_writable && lamp.rate_delay <= 0) {
    cssClass += ` ${classes.writeable}`;
  }

  const tooltipText = useMemo(() => {
    let text = lamp.status_text;

    if (!text) {
      return null;
    }
    if (lamp.rate_delay > 0) {
      text = `${text} (${lamp.rate_delay}s)`;
    }

    return <div dangerouslySetInnerHTML={{ __html: text }} />;
  }, [lamp.rate_delay, lamp.status_text]);

  const toggle = useCallback(() => {
    if (!lamp.is_writable) return;

    if (lamp.type === 'charwrite' || lamp.type === 'blinkenlight') {
      setDialogOpen(true);
    } else if (lamp.rate_delay <= 0) {
      executeAction('toggle', lamp.name);
    }
  }, [executeAction, lamp]);

  const imgProps = {
    className: cssClass,
    onClick: toggle,
    name: lamp.name,
    style,
    src: lamp.image,
  };

  let image;

  if (tooltipText) {
    image = <TooltipImg {...imgProps} tooltip={tooltipText} />;
  } else {
    image = <img {...imgProps} />;
  }

  const handleRequestClose = useCallback(() => {
    setDialogOpen(false);
  }, []);

  let dialog;

  if (lamp.type === 'blinkenlight') {
    dialog = dialogOpen && (
      <BlinkenlightPopup onRequestClose={handleRequestClose} lamp={lamp} />
    );
  }

  const duplicates = useMemo(() => {
    if (!lamp.duplicates || !lamp.duplicates.length) {
      return null;
    }

    const dup = lamp.duplicates[0];
    const dupStyle = {
      left: dup.x1,
      top: dup.y1,
      width: lamp.x2,
      height: lamp.y2,
    };

    let cssClass = classes.lamp;

    if (lamp.is_writable && lamp.rate_delay <= 0) {
      cssClass += ` ${classes.writeable}`;
    }
    const imgProps = {
      className: cssClass,
      onClick: toggle,
      name: lamp.name,
      style: dupStyle,
      src: lamp.image,
    };

    if (tooltipText) {
      return <TooltipImg {...imgProps} tooltip={tooltipText} />;
    }

    return <img {...imgProps} />;
  }, [classes, lamp, toggle, tooltipText]);

  return (
    <>
      {image}
      {duplicates}
      {dialog}
    </>
  );
};

export default LampComponent;
