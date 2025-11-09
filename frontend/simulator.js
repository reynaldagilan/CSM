// CSM (Cloud Service Lifecycle Management) Simulator
// Manages MapReduce service provisioning, scaling, monitoring, and fault recovery

class Service {
    constructor(id, type = 'mapreduce') {
        this.id = id;
        this.type = type;
        this.state = 'provisioning';
        this.instances = 1;
        this.cpu = 50;
        this.memory = 60;
        this.throughput = 1000;
        this.errors = 0;
        this.createdAt = new Date();
        this.lastHeartbeat = new Date();
    }

    provision() {
        if (this.state === 'provisioning') {
            setTimeout(() => {
                this.state = 'running';
                this.updateMetrics();
            }, 2000);
        }
    }

    scale(newInstances) {
        if (this.state === 'running') {
            this.state = 'scaling';
            setTimeout(() => {
                this.instances = newInstances;
                this.state = 'running';
                this.cpu = Math.max(20, this.cpu - 10 * (newInstances - 1));
                this.updateMetrics();
            }, 1500);
        }
    }

    injectFault() {
        if (this.state === 'running') {
            this.state = 'degraded';
            this.errors++;
            this.cpu += 30;
            this.throughput *= 0.5;
        }
    }

    recover() {
        if (this.state === 'degraded') {
            setTimeout(() => {
                this.state = 'running';
                this.errors = 0;
                this.cpu = Math.max(40, this.cpu - 20);
                this.throughput = 1000;
                this.updateMetrics();
            }, 1000);
        }
    }

    terminate() {
        this.state = 'terminated';
        this.instances = 0;
    }

    updateMetrics() {
        if (this.state === 'running') {
            this.cpu = Math.min(95, Math.max(40, this.cpu + (Math.random() - 0.5) * 10));
            this.memory = Math.min(95, Math.max(50, this.memory + (Math.random() - 0.5) * 8));
            this.throughput = Math.max(800, Math.min(2000, this.throughput + (Math.random() - 0.5) * 100));
        }
        this.lastHeartbeat = new Date();
    }
}

class CSMSimulator {
    constructor() {
        this.services = {};
        this.eventLog = [];
        this.alerts = [];
        this.metrics = { provisioned: 0, running: 0, failed: 0, recovered: 0 };
        this.simulationRunning = false;
    }

    provisionService(serviceId) {
        if (!this.services[serviceId]) {
            const service = new Service(serviceId, 'mapreduce');
            this.services[serviceId] = service;
            service.provision();
            this.logEvent(`Service ${serviceId} provisioning initiated`);
            this.metrics.provisioned++;
            return service;
        }
    }

    getService(serviceId) {
        return this.services[serviceId] || null;
    }

    scaleService(serviceId, instances) {
        const service = this.services[serviceId];
        if (service) {
            this.logEvent(`Scaling service ${serviceId} to ${instances} instances`);
            service.scale(instances);
        }
    }

    injectFault(serviceId) {
        const service = this.services[serviceId];
        if (service) {
            service.injectFault();
            this.logEvent(`FAULT INJECTED: Service ${serviceId} degraded`);
            this.addAlert(`CRITICAL: Service ${serviceId} in degraded state`);
            this.metrics.failed++;
        }
    }

    recoverService(serviceId) {
        const service = this.services[serviceId];
        if (service && service.state === 'degraded') {
            this.logEvent(`Recovery initiated for service ${serviceId}`);
            service.recover();
            this.metrics.recovered++;
        }
    }

    terminateService(serviceId) {
        const service = this.services[serviceId];
        if (service) {
            service.terminate();
            this.logEvent(`Service ${serviceId} terminated`);
        }
    }

    logEvent(message) {
        this.eventLog.push({
            timestamp: new Date(),
            message: message
        });
        if (this.eventLog.length > 100) this.eventLog.shift();
    }

    addAlert(message) {
        this.alerts.push({
            timestamp: new Date(),
            message: message,
            severity: message.includes('CRITICAL') ? 'critical' : 'warning'
        });
        if (this.alerts.length > 50) this.alerts.shift();
    }

    monitorServices() {
        Object.values(this.services).forEach(service => {
            if (service.state === 'running') {
                service.updateMetrics();
                if (service.cpu > 85) {
                    this.addAlert(`WARNING: Service ${service.id} high CPU: ${service.cpu.toFixed(1)}%`);
                }
                if (service.memory > 85) {
                    this.addAlert(`WARNING: Service ${service.id} high memory: ${service.memory.toFixed(1)}%`);
                }
            }
        });
    }

    startSimulation() {
        this.simulationRunning = true;
        this.monitorInterval = setInterval(() => {
            this.monitorServices();
        }, 2000);
        this.logEvent('CSM Simulation started');
    }

    stopSimulation() {
        this.simulationRunning = false;
        clearInterval(this.monitorInterval);
        this.logEvent('CSM Simulation stopped');
    }

    getStatus() {
        const status = {};
        Object.entries(this.services).forEach(([id, service]) => {
            status[id] = {
                state: service.state,
                instances: service.instances,
                cpu: service.cpu.toFixed(1),
                memory: service.memory.toFixed(1),
                throughput: service.throughput.toFixed(0)
            };
        });
        return status;
    }
}

const simulator = new CSMSimulator();

function initializeSimulator() {
    simulator.startSimulation();
    updateDashboard();
}

function updateDashboard() {
    const status = simulator.getStatus();
    updateMetrics();
    updateEventLog();
    updateAlerts();
}

function updateMetrics() {
    const serviceCount = Object.keys(simulator.services).length;
    const runningCount = Object.values(simulator.services).filter(s => s.state === 'running').length;
    const stats = document.querySelectorAll('.stat-item');
    if (stats.length >= 4) {
        stats[0].textContent = 'Services Deployed: ' + serviceCount;
        stats[1].textContent = 'Running: ' + runningCount;
        stats[2].textContent = 'Failed: ' + simulator.metrics.failed;
        stats[3].textContent = 'Recovered: ' + simulator.metrics.recovered;
    }
}

function updateEventLog() {
    const timeline = document.querySelector('.timeline');
    if (timeline) {
        timeline.innerHTML = simulator.eventLog.slice(-10).reverse().map(evt => 
            '<div class="event"><strong>' + evt.timestamp.toLocaleTimeString() + ':</strong> ' + evt.message + '</div>'
        ).join('');
    }
}

function updateAlerts() {
    const alertsList = document.querySelector('.alerts-list');
    if (alertsList) {
        alertsList.innerHTML = simulator.alerts.slice(-5).reverse().map(alert => 
            '<div class="alert alert-' + alert.severity + '">' + alert.message + '</div>'
        ).join('');
    }
}

document.addEventListener('DOMContentLoaded', initializeSimulator);

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CSMSimulator, Service, simulator };
}
