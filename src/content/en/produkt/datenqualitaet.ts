import type { PageContent, Translation } from '../../types';

/** Verbatim from docs/copy/en/produkt-datenqualitaet-en.md. */
export const datenqualitaet: Translation<PageContent> = {
  meta: {
    title: 'Data quality – every value with its provenance',
    description:
      'How Reticora identifies a device unambiguously, which source wins and why manual values stay. With source ranks, provenance per field and the review inbox.',
  },
  hero: {
    title: 'One device, one CI. Every value with its source.',
    lead:
      'Reticora merges observations from several sources into one CI – one entry in the CMDB. Fixed rules apply: which key identifies a device, which source wins and when a person decides. In the app this matching is called reconciliation.',
    actions: ['trial', 'demo'],
  },
  sections: [
    {
      id: 'schluessel',
      title: 'Five keys in a fixed order',
      lead: 'Before a value reaches a CI, Reticora settles which device it belongs to. It checks within one customer, key by key. [C-45]',
      blocks: [
        {
          kind: 'table',
          label: 'The five keys for identifying a device',
          rowHeader: 'key',
          columns: [
            { key: 'nr', head: 'No.', numeric: true },
            { key: 'key', head: 'Key' },
            { key: 'rule', head: 'Rule' },
          ],
          rows: [
            { nr: '1', key: 'Serial number', rule: 'Placeholders such as “To be filled by O.E.M.” do not count. [C-45]' },
            { nr: '2', key: 'Hardware UUID', rule: 'Known cloned UUIDs do not count; virtual machines also need a MAC address or hostname. [C-45]' },
            { nr: '3', key: 'MAC addresses', rule: 'A unique intersection; locally administered addresses and VRRP, HSRP and CARP addresses do not count. [C-45]' },
            { nr: '4', key: 'Management IP and sysObjectID', rule: 'only within the same VRF [C-45]' },
            { nr: '5', key: 'Hostname or FQDN', rule: 'Never leads to an automatic merge, only to a “Probable duplicate” review. [C-05, C-49]' },
          ],
        },
        { kind: 'prose', paras: ['This way one device never becomes a second CI, and two devices with the same name never silently become one. [C-05]'] },
      ],
    },
    {
      id: 'quelle-gewinnt',
      title: 'Which source wins',
      blocks: [
        {
          kind: 'split',
          paras: [
            'If two sources report different values for the same field, the value from the higher-ranked source applies. A value is only applied if its observation is newer than that of the stored value. What counts is the time of observation, not the time of arrival. [C-46, C-47]',
          ],
          side: {
            kind: 'table',
            label: 'Source ranking',
            rowHeader: 'source',
            columns: [
              { key: 'source', head: 'Source' },
              { key: 'rank', head: 'Rank', numeric: true },
            ],
            rows: [
              { source: 'manual, override', rank: '100' },
              { source: 'import', rank: '95' },
              { source: 'workflow', rank: '92' },
              { source: 'Redfish', rank: '90' },
              { source: 'agent', rank: '85' },
              { source: 'SNMP', rank: '80' },
              { source: 'API, integration', rank: '75' },
              { source: 'WMI', rank: '70' },
              { source: 'SSH, NAS', rank: '60' },
              { source: 'sweep', rank: '20' },
            ],
            after: '[C-46]',
          },
        },
        {
          kind: 'figure',
          paras: [
            'For every field the CI view shows the source, rank, time of observation and the reason why this value applies: manual override, highest-ranked source, value from the asset or value of the CI record. [C-03]',
          ],
          shot: { id: 'S-02', caption: 'Provenance of a field in the CI view.' },
        },
      ],
    },
    {
      id: 'manuell-gewinnt',
      title: 'Manual wins',
      blocks: [
        {
          kind: 'prose',
          paras: [
            'Whatever you set by hand is an override. No source overwrites it, not even a workflow. [C-04, C-65] If a source later reports a different value, an “Override conflict” review is created. You see both values and decide whether your value stays. [C-47, C-49] Commercial data such as serial number, location and purchase data is held by the asset; the CI only displays it. [C-56]',
          ],
        },
      ],
    },
    {
      id: 'review-inbox',
      title: 'The review inbox: three typical cases',
      lead:
        'The review inbox collects what automation may not decide on its own. You compare observation and CI side by side and decide: merge, create new, accept or discard. Nothing is discarded without your decision. [C-30, C-04]',
      blocks: [
        {
          kind: 'table',
          label: 'Three typical cases in the review inbox',
          rowHeader: 'case',
          columns: [
            { key: 'case', head: 'Case' },
            { key: 'shows', head: 'What Reticora shows' },
            { key: 'todo', head: 'What you do' },
          ],
          rows: [
            { case: 'Unknown device', shows: 'No profile matches. Reticora creates a generic device; the MAC address names the vendor. [C-40, C-91]', todo: 'Set the type, resolve the review.' },
            { case: 'Possible duplicate', shows: 'A new device has the same hostname as an existing CI, but the other keys do not match. [C-05, C-49]', todo: 'Merge if it is the same device; otherwise create new.' },
            { case: 'Different serial number', shows: 'Discovery reports a different serial number than the asset holds – for example after a mainboard swap. [C-49, C-56]', todo: 'Accept or discard the value.' },
          ],
        },
        {
          kind: 'figure',
          paras: ['**Other kinds of reviews:** ambiguous identity, conflicting values, resurrected device, duplicate IP address, unlicensed CI, suggested scope. [C-49]'],
          shot: { id: 'S-03', caption: 'Review inbox: observation and CI compared.' },
        },
      ],
    },
    {
      id: 'rueckgaengig',
      title: 'A merge can be undone',
      blocks: [
        {
          kind: 'prose',
          paras: [
            'When you merge two CIs, Reticora moves all references to the remaining CI; the old one redirects. If the merge turns out to be wrong, you undo it within 30 days. You can restore a deleted CI for 90 days. [C-48]',
          ],
        },
      ],
    },
    {
      id: 'nicht-mehr-gesehen',
      title: 'What is no longer seen',
      blocks: [
        {
          kind: 'prose',
          paras: [
            'A device that stops responding does not disappear. After three times the scope interval without being seen, the CI gets the status “unknown”. CIs created by hand stay as they are. [C-44] If discovery reports a device whose CI was deleted, Reticora does not simply create it again: the review inbox shows a “Resurrected device”, and you decide. [C-49]',
          ],
        },
      ],
    },
  ],
};
