// ECMA-262 5th Edition, 15.12.1 The JSON Grammar. Parses JSON strings into objects.
// Derived from .js version by Zach Carter
digit   [0-9]
int     "-"?(?:[0-9]|[1-9][0-9]+)
exp     (?:[eE][-+]?[0-9]+)
frac    (?:\.[0-9]+)

%options ranges

%%

\s+                        /* skip whitespace */
{int}{frac}?{exp}?\\b       return 'NUMBER';
"\""(?:\\[\"bfnrt/\\]|\\u[a-fA-F0-9]{4}|[^\"\\])*"\""      { yytext = yytext.substr(1,yyleng-2); return 'STRING'; }
\{                         return '{';
\}                         return '}';
\[                         return '[';
\]                         return ']';
","                           return ',';
":"                           return ':';
"true\b"                     return 'TRUE';
"false\b"                    return 'FALSE';
"null\b"                     return 'NULL';
