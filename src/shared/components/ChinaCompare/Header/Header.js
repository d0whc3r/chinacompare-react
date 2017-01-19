/* @flow */

import React, { Component } from 'react';
import Logo from './Logo';
import Menu from './Menu';

export class Header extends Component {
  render() {
    return (
      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <Logo />
        <h1>React, Universally</h1>
        <strong>
          A starter kit giving you the minimum requirements for a modern universal react application.
        </strong>
        <Menu />
      </div>
    );
  }
}

export default Header;
