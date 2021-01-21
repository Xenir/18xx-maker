import React from "react";
import Color from "../util/Color";

const Industry = ({ top, bottom }) => {
  return (
    <Color context="companies">
      {(c, t, s, p) => (
        <g>
          <circle fill={p("white")} stroke="none" r="18" cx="0" cy="0" />
          <path
            d="M -18 0 A 18 18 0 0 1 18 0 Z"
            fill={c("pink")}
            fillOpacity="0.2"
            stroke={c("pink")}
            strokeWidth="2"
          />
          <path
            d="M -18 0 A 18 18 0 0 0 18 0 Z"
            fill="none"
            stroke={c("pink")}
            strokeWidth="2"
          />
          <text
            fontSize={12}
            fontFamily="display"
            fill={c("pink")}
            dominantBaseline="central"
            textAnchor="middle"
            x="0"
            y="-9"
          >
            {top}
          </text>
          <text
            fontSize={12}
            fontFamily="display"
            fill={c("pink")}
            dominantBaseline="central"
            textAnchor="middle"
            x="0"
            y="7"
          >
            {bottom}
          </text>
        </g>
      )}
    </Color>
  );
};

export default Industry;
