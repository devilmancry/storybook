import React, { FC } from 'react';
import pickBy from 'lodash/pickBy';
import { styled, ignoreSsrWarning } from '@storybook/theming';
import { opacify, transparentize, darken, lighten } from 'polished';
import { ArgRow } from './ArgRow';
import { SectionRow } from './SectionRow';
import { ArgType, ArgTypes, Args } from './types';
import { EmptyBlock } from '../EmptyBlock';
import { Link } from '../../typography/link/link';
import { ResetWrapper } from '../../typography/DocumentFormatting';

export const TableWrapper = styled.table<{ compact?: boolean; inAddonPanel?: boolean }>(
  ({ theme, compact, inAddonPanel }) => ({
    '&&': {
      // Resets for cascading/system styles
      borderCollapse: 'collapse',
      borderSpacing: 0,
      color: theme.color.defaultText,

      'td, th': {
        padding: 0,
        border: 'none',
        verticalAlign: 'top',
        textOverflow: 'ellipsis',
      },
      // End Resets

      fontSize: theme.typography.size.s2 - 1,
      lineHeight: '20px',
      textAlign: 'left',
      width: '100%',

      // Margin collapse
      marginTop: inAddonPanel ? 0 : 25,
      marginBottom: inAddonPanel ? 0 : 40,

      'thead th:first-of-type, td:first-of-type': {
        width: '30%',
      },

      'th:first-of-type, td:first-of-type': {
        paddingLeft: 20,
      },

      'th:last-of-type, td:last-of-type': {
        paddingRight: 20,
        ...(compact
          ? null
          : {
              minWidth: '15%',
              maxWidth: '25%',
            }),
      },

      th: {
        color:
          theme.base === 'light'
            ? transparentize(0.25, theme.color.defaultText)
            : transparentize(0.45, theme.color.defaultText),
        paddingTop: 10,
        paddingBottom: 10,

        '&:not(:first-of-type)': {
          paddingLeft: 15,
          paddingRight: 15,
        },
      },

      td: {
        paddingTop: '10px',
        paddingBottom: '10px',

        '&:not(:first-of-type)': {
          paddingLeft: 15,
          paddingRight: 15,
        },

        '&:last-of-type': {
          paddingRight: 20,
        },
      },

      // Table "block" styling
      // Emphasize tbody's background and set borderRadius
      // Calling out because styling tables is finicky

      // Makes border alignment consistent w/other DocBlocks
      marginLeft: inAddonPanel ? 0 : 1,
      marginRight: inAddonPanel ? 0 : 1,

      [`tr:first-child${ignoreSsrWarning}`]: {
        [`td:first-child${ignoreSsrWarning}, th:first-child${ignoreSsrWarning}`]: {
          borderTopLeftRadius: inAddonPanel ? 0 : theme.appBorderRadius,
        },
        [`td:last-child${ignoreSsrWarning}, th:last-child${ignoreSsrWarning}`]: {
          borderTopRightRadius: inAddonPanel ? 0 : theme.appBorderRadius,
        },
      },

      [`tr:last-child${ignoreSsrWarning}`]: {
        [`td:first-child${ignoreSsrWarning}, th:first-child${ignoreSsrWarning}`]: {
          borderBottomLeftRadius: inAddonPanel ? 0 : theme.appBorderRadius,
        },
        [`td:last-child${ignoreSsrWarning}, th:last-child${ignoreSsrWarning}`]: {
          borderBottomRightRadius: inAddonPanel ? 0 : theme.appBorderRadius,
        },
      },

      tbody: {
        // slightly different than the other DocBlock shadows to account for table styling gymnastics
        boxShadow:
          !inAddonPanel &&
          (theme.base === 'light'
            ? `rgba(0, 0, 0, 0.10) 0 1px 3px 1px,
          ${transparentize(0.035, theme.appBorderColor)} 0 0 0 1px`
            : `rgba(0, 0, 0, 0.20) 0 2px 5px 1px,
          ${opacify(0.05, theme.appBorderColor)} 0 0 0 1px`),
        borderRadius: theme.appBorderRadius,

        tr: {
          background: 'transparent',
          overflow: 'hidden',
          ...(inAddonPanel
            ? {
                borderTopWidth: 1,
                borderTopStyle: 'solid',
                borderTopColor:
                  theme.base === 'light'
                    ? darken(0.1, theme.background.content)
                    : lighten(0.05, theme.background.content),
              }
            : {
                [`&:not(:first-child${ignoreSsrWarning})`]: {
                  borderTopWidth: 1,
                  borderTopStyle: 'solid',
                  borderTopColor:
                    theme.base === 'light'
                      ? darken(0.1, theme.background.content)
                      : lighten(0.05, theme.background.content),
                },
              }),
        },

        td: {
          background: theme.background.content,
        },
      },
      // End finicky table styling
    },
  })
);

export enum ArgsTableError {
  NO_COMPONENT = 'No component found.',
  ARGS_UNSUPPORTED = 'Args unsupported. See Args documentation for your framework.',
}

export interface ArgsTableRowProps {
  rows: ArgTypes;
  args?: Args;
  updateArgs?: (args: Args) => void;
  compact?: boolean;
  inAddonPanel?: boolean;
}

export interface ArgsTableErrorProps {
  error: ArgsTableError;
}

export type ArgsTableProps = ArgsTableRowProps | ArgsTableErrorProps;

type Rows = ArgType[];
type Subsection = Rows;
type Section = {
  ungrouped: Rows;
  subsections: Record<string, Subsection>;
};
type Sections = {
  ungrouped: Rows;
  ungroupedSubsections: Record<string, Subsection>;
  sections: Record<string, Section>;
};

const groupRows = (rows: ArgType) => {
  const sections: Sections = { ungrouped: [], ungroupedSubsections: {}, sections: {} };
  if (!rows) return sections;

  Object.entries(rows).forEach(([key, row]) => {
    const { category, subcategory } = row?.table || {};
    if (category) {
      const section = sections.sections[category] || { ungrouped: [], subsections: {} };
      if (!subcategory) {
        section.ungrouped.push({ key, ...row });
      } else {
        const subsection = section.subsections[subcategory] || [];
        subsection.push({ key, ...row });
        section.subsections[subcategory] = subsection;
      }
      sections.sections[category] = section;
    } else if (subcategory) {
      const subsection = sections.ungroupedSubsections[subcategory] || [];
      subsection.push({ key, ...row });
      sections.ungroupedSubsections[subcategory] = subsection;
    } else {
      sections.ungrouped.push({ key, ...row });
    }
  });
  return sections;
};

/**
 * Display the props for a component as a props table. Each row is a collection of
 * ArgDefs, usually derived from docgen info for the component.
 */
export const ArgsTable: FC<ArgsTableProps> = (props) => {
  const { error } = props as ArgsTableErrorProps;
  if (error) {
    return (
      <EmptyBlock>
        {error}&nbsp;
        <Link href="http://storybook.js.org/docs/" target="_blank" withArrow>
          Read the docs
        </Link>
      </EmptyBlock>
    );
  }

  const { rows, args, updateArgs, compact, inAddonPanel } = props as ArgsTableRowProps;

  const groups = groupRows(pickBy(rows, (row) => !row?.table?.disable));

  if (
    groups.ungrouped.length === 0 &&
    Object.entries(groups.sections).length === 0 &&
    Object.entries(groups.ungroupedSubsections).length === 0
  ) {
    return (
      <EmptyBlock>
        No inputs found for this component.&nbsp;
        <Link href="http://storybook.js.org/docs/" target="_blank" withArrow>
          Read the docs
        </Link>
      </EmptyBlock>
    );
  }

  let colSpan = 1;
  if (updateArgs) colSpan += 1;
  if (!compact) colSpan += 2;
  const expandable = Object.keys(groups.sections).length > 0;

  const common = { updateArgs, compact, inAddonPanel };
  return (
    <ResetWrapper>
      <TableWrapper {...{ compact, inAddonPanel }} className="docblock-argstable">
        <thead className="docblock-argstable-head">
          <tr>
            <th>Name</th>
            {compact ? null : <th>Description</th>}
            {compact ? null : <th>Default</th>}
            {updateArgs ? <th>Control</th> : null}
          </tr>
        </thead>
        <tbody className="docblock-argstable-body">
          {groups.ungrouped.map((row) => (
            <ArgRow key={row.key} row={row} arg={args && args[row.key]} {...common} />
          ))}

          {Object.entries(groups.ungroupedSubsections).map(([subcategory, subsection]) => (
            <SectionRow key={subcategory} label={subcategory} level="subsection" colSpan={colSpan}>
              {subsection.map((row) => (
                <ArgRow
                  key={row.key}
                  row={row}
                  arg={args && args[row.key]}
                  expandable={expandable}
                  {...common}
                />
              ))}
            </SectionRow>
          ))}

          {Object.entries(groups.sections).map(([category, section]) => (
            <SectionRow key={category} label={category} level="section" colSpan={colSpan}>
              {section.ungrouped.map((row) => (
                <ArgRow key={row.key} row={row} arg={args && args[row.key]} {...common} />
              ))}
              {Object.entries(section.subsections).map(([subcategory, subsection]) => (
                <SectionRow
                  key={subcategory}
                  label={subcategory}
                  level="subsection"
                  colSpan={colSpan}
                >
                  {subsection.map((row) => (
                    <ArgRow
                      key={row.key}
                      row={row}
                      arg={args && args[row.key]}
                      expandable={expandable}
                      {...common}
                    />
                  ))}
                </SectionRow>
              ))}
            </SectionRow>
          ))}
        </tbody>
      </TableWrapper>
    </ResetWrapper>
  );
};
