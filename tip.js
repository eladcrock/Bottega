function calculateTip() {
    const gratuity = parseFloat(document.getElementById('gratuity').value) || 0;
    const sales = parseFloat(document.getElementById('sales').value) || 0;
    const wine = parseFloat(document.getElementById('wine').value) || 0;
    const host_total = parseInt(document.getElementById('host_total').value) || 0;
    const runner_total = parseInt(document.getElementById('runner_total').value) || 0;

    const BUSSER_PERCENT = 0.16;
    const PORTER_PERCENT = 0.01;
    const SOLO_PERCENT = 0.045;
    const DUO_PERCENT = 0.07;
    const TRIO_PERCENT = 0.09;
    const WINE_PERCENT = 0.03;

    let buffTip = 0, hostTip = 0, barTip = 0, totalTip = 0,
        bussTip, sommTip = 0, runTip = 0;

    if (sales < 2500) {
        buffTip = sales * PORTER_PERCENT;
    } else if (sales >= 2500) {
        buffTip = 25;
    }

    if (wine > 0) {
        sommTip = wine * WINE_PERCENT;
    }

    if (runner_total === 3) {
        runTip = gratuity * TRIO_PERCENT;
    } else if (runner_total === 2) {
        runTip = gratuity * DUO_PERCENT;
    } else if (runner_total === 1) {
        runTip = gratuity * SOLO_PERCENT;
    }

    if (host_total === 3) {
        hostTip = gratuity * TRIO_PERCENT;
    } else if (host_total === 2) {
        hostTip = gratuity * DUO_PERCENT;
    } else if (host_total === 1) {
        hostTip = gratuity * SOLO_PERCENT;
    }

    bussTip = gratuity * BUSSER_PERCENT;
    barTip = gratuity * DUO_PERCENT;

    const netTip = gratuity - bussTip - sommTip - hostTip - runTip - buffTip - barTip;
    totalTip = gratuity - netTip;

    document.getElementById('output').innerHTML = `
        <p>Based on Values Provided</p>
        <p>You will tip-out:</p>
        <p>$${bussTip.toFixed(2)} to Busser</p>
        <p>$${sommTip.toFixed(2)} to Somm</p>
        <p>$${buffTip.toFixed(2)} to Porter</p>
        <p>$${runTip.toFixed(2)} to Runner</p>
        <p>$${barTip.toFixed(2)} to Bar</p>
        <p>$${hostTip.toFixed(2)} to Host</p>
        <p>Server tips: $${netTip.toFixed(2)}</p>
        <p>Total tipout: $${totalTip.toFixed(2)}</p>
        <p></p>
            <p>Keep up the great work!</p>

    `;
}
