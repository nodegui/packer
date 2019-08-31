import process from 'process';

export const getPacker = (platformName: string)=>{
  switch(platformName){
    case 'darwin': {
      return require('./darwin');
    }
    case 'win32': {
      return require('./win32');
    }
    case 'linux': {
      return require('./linux');
    }
    default: {
      throw new Error(`Unsupported platform ${process.platform}`)
    }
  }
}
