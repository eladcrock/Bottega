function calculateTip() {
    const totalTips = parseFloat(document.getElementById('totalTips').value) || 0;
    const netSales = parseFloat(document.getElementById('netSales').value) || 0;
    const wineSales = parseFloat(document.getElementById('wineSales').value) || 0;
    const numHosts = parseInt(document.getElementById('numHosts').value) || 0;
    const numRunners = parseInt(document.getElementById('numRunners').value) || 0;

    const BUSSER_PERCENT = 0.16;
    const PORTER_PERCENT = 0.01;
    const SOLO_PERCENT = 0.045;
    const DUO_PERCENT = 0.07;
    const TRIO_PERCENT = 0.09;
    const WINE_PERCENT = 0.03;
    const KITCHEN_TIP = 5;

    let buffTip = 0, hostTip = 0, barTip = 0, totalTip = 0,
        bussTip, sommTip = 0, runTip = 0, kitchenTip = 0;

    if (netSales < 2500) {
        buffTip = netSales * PORTER_PERCENT;
    } else {
        buffTip = 25;
    }

    if (wineSales > 0) {
        sommTip = wineSales * WINE_PERCENT;
    }

    if (numRunners === 3) {
        runTip = totalTips * TRIO_PERCENT;
    } else if (numRunners === 2) {
        runTip = totalTips * DUO_PERCENT;
    } else if (numRunners === 1) {
        runTip = totalTips * SOLO_PERCENT;
    }

    if (numHosts === 3) {
        hostTip = totalTips * TRIO_PERCENT;
    } else if (numHosts === 2) {
        hostTip = totalTips * DUO_PERCENT;
    } else if (numHosts === 1) {
        hostTip = totalTips * SOLO_PERCENT;
    }

    bussTip = totalTips * BUSSER_PERCENT;
    barTip = totalTips * DUO_PERCENT;

    if (totalTips > 0) {
        kitchenTip = KITCHEN_TIP;
    }

    const netTip = totalTips - bussTip - sommTip - hostTip - runTip - buffTip - barTip - kitchenTip;
    totalTip = totalTips - netTip;

    document.getElementById('output').innerHTML = `
        <p>Based on a NET of $${netSales.toFixed(2)}</p>
        <p>Wine sales of $${wineSales.toFixed(2)},</p>
        <p>with ${numHosts} Hosts, ${numRunners} Runners,</p>
        <p>You will tip-out:</p>
        <p>$${bussTip.toFixed(2)} to Busser</p>
        <p>$${sommTip.toFixed(2)} to Somm</p>
        <p>$${buffTip.toFixed(2)} to Porter</p>
        <p>$${runTip.toFixed(2)} to Runner(s)</p>
        <p>$${barTip.toFixed(2)} to Bar</p>
        <p>$${hostTip.toFixed(2)} to Host(s)</p>
        <p>$${kitchenTip.toFixed(2)} to Kitchen</p>
        <p>Server tips: $${netTip.toFixed(2)}</p>
        <p>Total tipout: $${totalTip.toFixed(2)}</p>
    `;

    document.getElementById('results').classList.remove('hidden');
}
