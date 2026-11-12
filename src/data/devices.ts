/**
 * Gerätefamilien, die der Collector von Haus aus erkennt.
 *
 * Quelle (Produkt-Repository, Stand 2026-11-12):
 * - collector/profiles/profiles.go (Aufbau eines Profils: vendor, model, protocol, ciType,
 *   sysObjectIds, redfishPattern)
 * - collector/profiles/data/*.yaml (die mitgelieferten Profile): apc, arista, aruba, cisco,
 *   dell, firewall, fortinet, hpe, hypervisor, juniper, lenovo, mikrotik, nas, netapp, os,
 *   power, supermicro, synology, ubiquiti
 *
 * Regeln der Ableitung:
 * - Je Profil mit `ciType` (nur diese klassifizieren) eine Familie; Profile ohne `ciType`
 *   (cisco-ios-ssh, juniper-junos-ssh, mikrotik-routeros-api) ergänzen nur die Protokolle
 *   ihrer Familie. generic.yaml bleibt außen vor (keine Familie).
 * - `category` aus `ciType`: switch, router, firewall, access_point → network;
 *   server, hypervisor → server; nas, storage_array → storage; ups, pdu → power.
 * - `protocols`: Feld `protocol` der Profile der Familie; `sysObjectIds` → SNMP;
 *   `redfishPattern` → Redfish.
 * - Das Profil opnsense-pfsense (vendor „Deciso/Netgate“) steht hier als zwei Einträge.
 * - linux-ssh hat keinen Hersteller; es steht als „Linux“ / „Server“.
 */
export type DeviceCategory = 'network' | 'server' | 'storage' | 'power' | 'other';

export interface Device {
  vendor: string;
  family: string;
  category: DeviceCategory;
  protocols: string[];
}

export const DEVICES: Device[] = [
  // Netzwerk
  { vendor: 'Arista', family: 'EOS', category: 'network', protocols: ['SNMP'] },
  { vendor: 'Aruba', family: 'CX 6xxx', category: 'network', protocols: ['SNMP'] },
  { vendor: 'Cisco', family: 'IOS', category: 'network', protocols: ['SNMP', 'SSH'] },
  { vendor: 'Cisco', family: 'Catalyst 9200/9300', category: 'network', protocols: ['SNMP'] },
  { vendor: 'Cisco', family: 'ISR/ASR', category: 'network', protocols: ['SNMP'] },
  { vendor: 'Cisco', family: 'ASA/Firepower', category: 'network', protocols: ['SNMP'] },
  { vendor: 'Dell', family: 'OS10', category: 'network', protocols: ['SNMP'] },
  { vendor: 'Deciso', family: 'OPNsense', category: 'network', protocols: ['SNMP'] },
  { vendor: 'Fortinet', family: 'FortiGate', category: 'network', protocols: ['SNMP'] },
  { vendor: 'HPE', family: 'ProCurve', category: 'network', protocols: ['SNMP'] },
  { vendor: 'Juniper', family: 'Junos', category: 'network', protocols: ['SNMP', 'SSH'] },
  { vendor: 'MikroTik', family: 'RouterOS', category: 'network', protocols: ['SNMP', 'SSH'] },
  { vendor: 'Netgate', family: 'pfSense', category: 'network', protocols: ['SNMP'] },
  { vendor: 'Ubiquiti', family: 'UniFi Access Point', category: 'network', protocols: ['SNMP'] },
  { vendor: 'Ubiquiti', family: 'UniFi Switch', category: 'network', protocols: ['SNMP'] },
  // Server und Virtualisierung
  { vendor: 'Dell', family: 'PowerEdge (iDRAC)', category: 'server', protocols: ['SNMP', 'Redfish'] },
  { vendor: 'HPE', family: 'ProLiant (iLO)', category: 'server', protocols: ['SNMP', 'Redfish'] },
  { vendor: 'Lenovo', family: 'ThinkSystem (XCC)', category: 'server', protocols: ['SNMP', 'Redfish'] },
  { vendor: 'Supermicro', family: 'BMC', category: 'server', protocols: ['SNMP', 'Redfish'] },
  { vendor: 'VMware', family: 'ESXi', category: 'server', protocols: ['SNMP'] },
  { vendor: 'Proxmox', family: 'VE', category: 'server', protocols: ['SNMP', 'SSH'] },
  { vendor: 'Microsoft', family: 'Windows Server', category: 'server', protocols: ['SNMP', 'WMI'] },
  { vendor: 'Linux', family: 'Server', category: 'server', protocols: ['SNMP', 'SSH'] },
  // Storage
  { vendor: 'iXsystems', family: 'TrueNAS', category: 'storage', protocols: ['SNMP', 'SSH'] },
  { vendor: 'NetApp', family: 'ONTAP', category: 'storage', protocols: ['SNMP'] },
  { vendor: 'QNAP', family: 'QTS', category: 'storage', protocols: ['SNMP'] },
  { vendor: 'Synology', family: 'DSM', category: 'storage', protocols: ['SNMP'] },
  // Strom
  { vendor: 'APC', family: 'Smart-UPS (Network Management Card)', category: 'power', protocols: ['SNMP'] },
  { vendor: 'APC', family: 'Rack PDU', category: 'power', protocols: ['SNMP'] },
  { vendor: 'Eaton', family: 'UPS', category: 'power', protocols: ['SNMP'] },
  { vendor: 'Raritan', family: 'PX PDU', category: 'power', protocols: ['SNMP'] },
];
