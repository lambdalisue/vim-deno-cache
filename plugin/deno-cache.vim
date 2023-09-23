if exists('g:loaded_deno_cache')
  finish
endif
let g:loaded_cache = 1

augroup deno_cache_plugin
  autocmd!
  autocmd BufReadCmd deno:/* 
        \ call denops#request("deno-cache", "read", [expand("%")])
  autocmd BufReadCmd deno:/* 
        \ command! -buffer -nargs=0 Restore call denops#request("deno-cache", "restore", [expand("%")])
  autocmd BufWriteCmd deno:/* 
        \ call denops#request("deno-cache", "write", [expand("%")])
augroup END
