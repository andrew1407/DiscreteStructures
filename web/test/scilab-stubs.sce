// Turns the lab scripts into console-only programs: graphics and pauses
// become no-ops so they can run under scilab-cli (no GUI).
funcprot(0);
lines(0, 1000);
function plot2d(varargin), endfunction
function xarc(varargin), endfunction
function xnumb(varargin), endfunction
function xsegs(varargin), endfunction
function xarrows(varargin), endfunction
function xset(varargin), endfunction
function xdel(varargin), endfunction
function scf(varargin), endfunction
function halt(varargin), endfunction
