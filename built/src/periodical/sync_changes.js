if (K) {
    var K_dump = stringify(K);
    // rewrite only if changed
    if (K_dump != last_K_dump) {
        fs.writeFileSync(require('path').resolve(__dirname, '../../' + datadir + '/onchain/k.json'), K_dump);
        last_K_dump = K_dump;
    }
}
