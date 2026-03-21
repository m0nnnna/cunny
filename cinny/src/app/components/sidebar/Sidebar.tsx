import classNames from 'classnames';
import { as } from 'folds';
import React from 'react';
import * as css from './Sidebar.css';

export const Sidebar = as<'aside'>(({ as: AsSidebar = 'aside', className, ...props }, ref) => (
  <AsSidebar className={classNames(css.Sidebar, className)} {...props} ref={ref} />
));
