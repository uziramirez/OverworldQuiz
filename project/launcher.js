#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

const electronPath = path.join(__dirname, 'node_modules', '.bin', 'electron');
const args = [path.join(__dirname, 'public', 'electron.js')];

const electron = spawn(electronPath, args, {
  stdio: 'inherit',
});

electron.on('exit', (code) => {
  process.exit(code);
});
