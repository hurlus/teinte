<?php
/**
 * This class should perform all that Hurlus want with XML/TEI source
 * with custom design
 */
include dirname(dirname(__FILE__)).'/latex/latex.php';

if (isset($argv[0]) && realpath($argv[0]) == realpath(__FILE__)) Hurlus::cli(); //direct CLI
class Hurlus {

  public static function pdf($teifile, $dstdir='')
  {
    if ($dstdir) {
      $dstdir = rtrim($dstdir, '/\\').'/';
      if (!file_exists($dstdir)) {
        mkdir($dstdir, 0775, true);
        @chmod($dstdir, 0775);  // let @, if www-data is not owner but allowed to write
      }
    }
    $latex = new Latex();
    $latex->load($teifile);
    $texfile = $latex->setup(dirname(__FILE__).'/hurlus.tex'); // get the texfile installed with its resources
    $texname = pathinfo($texfile, PATHINFO_FILENAME);
    $workdir = dirname($texfile).'/';

    chdir($workdir); // change working directory
    // default is a4 2 cols, transform to pdf
    exec("latexmk -xelatex -quiet -f ".$texname.'.tex');
    if ($dstdir) rename($workdir.$texname.'.pdf', $dstdir.$texname.'.pdf');


    $tex = file_get_contents($texfile);
    // A5
    $tex = preg_replace('@\\\\def\\\\mode\{[^\}]*\}@', '\\def\\mode{a5}', $tex);
    $texsrc = $texname.'_a5.tex';
    file_put_contents($texsrc, $tex);
    exec("latexmk -xelatex -quiet -f ".$texsrc); //
    if ($dstdir) rename($workdir.$texname.'_a5.pdf', $dstdir.$texname.'_a5.pdf');

    // booklet
    $tex = preg_replace('@\\\\def\\\\mode\{[^\}]*\}@', '\\def\\mode{booklet}', $tex);
    $texsrc = $texname.'_a4v2.tex';
    file_put_contents($texsrc, $tex);
    exec("latexmk -xelatex -quiet -f ".$texsrc); //
    $booklet = $texname.'_brochure.tex';
    copy(dirname(dirname(__FILE__)).'/latex/booklet_a4v2.tex', $workdir.$booklet);
    $cmd = "lualatex $booklet ".$texname.'_a4v2.pdf';
    exec($cmd); // order pages for printing
    if ($dstdir) rename($workdir.$texname.'_brochure.pdf', $dstdir.$texname.'_brochure.pdf');

  }

  public static function cli()
  {
    array_shift($_SERVER['argv']); // shift first arg, the script filepath
    if (!count($_SERVER['argv'])) exit("
usage    : php -f hurlus.php (dstdir/)? srcdir/*.xml\n");

    /*
    $dstdir = "";
    $lastc = substr($_SERVER['argv'][0], -1);
    if ('/' == $lastc || '\\' == $lastc) {
      $dstdir = array_shift($_SERVER['argv']);
      $dstdir = rtrim($dstdir, '/\\').'/';
      if (!file_exists($dstdir)) {
        mkdir($dstdir, 0775, true);
        @chmod($dstdir, 0775);  // let @, if www-data is not owner but allowed to write
      }
    }
    */

    while($glob = array_shift($_SERVER['argv']) ) {
      foreach(glob($glob) as $teifile) {
      }
    }

  }
}

?>
