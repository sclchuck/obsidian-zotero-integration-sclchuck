import os from 'os';

import download from 'download';
import { Notice } from 'obsidian';
import React from 'react';

import { doesEXEExist, getExeRoot, removeEXE } from 'src/helpers';
import { ZoteroConnectorSettings } from 'src/types';

import { Icon } from './Icon';
import { SettingItem } from './SettingItem';

const currentVersion = '0.0.11';

const options: Record<string, Record<string, string>> = {
  darwin: {
    x64: `https://github.com/mgmeyers/pdf-annots2json/releases/download/${currentVersion}/pdf-annots2json.darwin.amd64.tar.gz`,
    arm64: `https://github.com/mgmeyers/pdf-annots2json/releases/download/${currentVersion}/pdf-annots2json.darwin.arm64.tar.gz`,
  },
  linux: {
    x64: `https://github.com/mgmeyers/pdf-annots2json/releases/download/${currentVersion}/pdf-annots2json.linux.amd64.tar.gz`,
  },
  win32: {
    x64: `https://github.com/mgmeyers/pdf-annots2json/releases/download/${currentVersion}/pdf-annots2json.windows.amd64.zip`,
  },
};

function getDownloadUrl() {
  const platform = options[os.platform()];

  if (!platform) return null;

  const url = platform[os.arch()];

  if (!url) return null;

  return url;
}

async function downloadAndExtract() {
  const url = getDownloadUrl();

  console.log('Zotero Desktop Connector: Downloading ' + url);

  if (!url) return false;

  try {
    if (doesEXEExist()) {
      removeEXE();
    }

    await download(url, getExeRoot(), {
      extract: true,
    });
  } catch (e) {
    console.error(e);
    new Notice(
      'Error downloading PDF utility. Check the console for more details.',
      10000
    );
  }

  return true;
}

export function AssetDownloader(props: {
  exeVersion?: string;
  updateSetting: (key: keyof ZoteroConnectorSettings, value: any) => void;
}) {
  const [exeVersion, setExeVersion] = React.useState(props.exeVersion);
  const [isLoading, setIsLoading] = React.useState(false);
  const [exists, setExists] = React.useState(false);

  React.useEffect(() => {
    if (doesEXEExist()) {
      setExists(true);
    } else {
      setExists(false);
    }
  }, []);

  const handleDownload = React.useCallback(() => {
    setIsLoading(true);

    downloadAndExtract().then((success) => {
      setIsLoading(false);

      if (success) {
        props.updateSetting('exeVersion', currentVersion);
        setExeVersion(currentVersion);
        setExists(true);
      }
    });
  }, []);

  const desc = [
    'Extracting data from PDFs requires an external tool.',
    'This plugin will still work without it, but annotations will not be included in exports.',
  ];

  if (exists && currentVersion === exeVersion) {
    return (
      <SettingItem name="PDF Utility" description={desc.join(' ')}>
        <div className="zt-asset-success">
          <div className="zt-asset-success__icon">
            <Icon name="check-small" />
          </div>
          <div className="zt-asset-success__message">
            PDF utility is up to date.
          </div>
        </div>
      </SettingItem>
    );
  }

  if (exists) {
    desc.push('The PDF extraction tool requires updating. Please re-download.');
  } else {
    desc.push('Click the button to download.');
  }

  return (
    <SettingItem name="PDF Utility" description={desc.join(' ')}>
      <button disabled={isLoading} onClick={handleDownload}>
        {isLoading ? 'Downloading...' : 'Download'}
      </button>
    </SettingItem>
  );
}