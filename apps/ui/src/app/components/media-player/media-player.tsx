import React, { useEffect, useRef } from 'react';
import './media-player.scss';
import { Button, IconButton, Slider, Switch, Tab, Tabs } from '@material-ui/core';
import { ArrowBack, FavoriteBorder, MoreHoriz, Settings, VolumeOff, VolumeUp } from '@material-ui/icons';
import MyTooltip from '../tooltip/tooltip';
import { useDispatch, useSelector } from 'react-redux';
import { REAL_SONG_LIST } from '../right-sidebar/data';
import { LOOP_STATE, RANDOM_STATE, VOLUME_STATE } from './localStorage-constanrts';
import RedirectLink from '../redirect/redirect';
import { withStyles } from '@material-ui/core/styles';
import TabPanel from '../right-sidebar/tabpanel';
import CarouselExpandItem from './child-components/carousel-expand-item';
import { CombineActions } from '../../../redux/store/store';

function a11yProps(index: number) {
  return {
    id: `full-width-tab-${index}`,
    'aria-controls': `full-width-tabpanel-${index}`
  };
}


const enum ToolTipClickState {
  open,
  close
}

const PurpleSwitch = withStyles({
  switchBase: {
    color: '#7200A1',
    '&$checked': {
      color: '#c63bff !important'
    },
    '&$checked + $track': {
      backgroundColor: '#c63bff !important'
    }
  },
  checked: {},

  track: {}
})(Switch);

const MediaPlayer = () => {
    const [tabsValue, setTabsValue] = React.useState(0);
    // eslint-disable-next-line @typescript-eslint/ban-types
    const handleTabsChange = (event: React.ChangeEvent<{}>, newValue: number) => {
      setTabsValue(newValue);
    };
    // set localStorage for media actions button state
    const localLoopState = Number(localStorage.getItem(LOOP_STATE));
    if (!localLoopState) {
      localStorage.setItem(LOOP_STATE, '0');
    }
    const localRandomState = localStorage.getItem(RANDOM_STATE);
    if (!localRandomState) {
      localStorage.setItem(RANDOM_STATE, 'false');
    }
    const localVolumeState = Number(localStorage.getItem(VOLUME_STATE));
    if (!localVolumeState) {
      localStorage.setItem(VOLUME_STATE, '80');
    }
    // end
    const [currentVolume, setCurrentVolume] = React.useState<number>(localVolumeState);
    const [isMute, setIsMute] = React.useState<boolean>(false);
    const [randomState, setRandomState] = React.useState<string>(localRandomState);
    const [loopState, setLoopState] = React.useState<number>(localLoopState);
    const subMedia = React.useRef<HTMLDivElement>();
    //! start audio controller
    const [timePlaying, setTimePlaying] = React.useState<number>(0);
    const [audioTimerDuration, setAudioTimerDuration] = React.useState<number>(0);
    const audioRef = useRef<HTMLAudioElement>();
    const audioDuration = (time) => {
      const hours = ('0' + Math.floor(time / 3600));
      const ch = Number(hours);
      const minutes = ('0' + Math.floor((time - ch * 3600) / 60)).slice(-2);
      const seconds = ('0' + Math.floor(time - Math.floor(time / 60) * 60)).slice(-2);
      return ch !== 0 ? `${hours}:${minutes}:${seconds}` : `${minutes}:${seconds}`;
    };

    const handleMediaControlTime = (event: never, newValue: number | number[]) => {
      const val = newValue as number;
      setTimePlaying(val);
      audioRef.current.currentTime = val;
    };
    const isPlay = useSelector<CombineActions>((state) => state.onPlayReducer.isPlaying);
    const dispatch = useDispatch();

    const setPlay = () => {
      dispatch({ type: 'TOGGLE_PLAYING_SONG', payload: isPlay });
    };
    const handleIsPlay = () => {
      if (isPlay) {
        audioRef.current.play().then();
      } else {
        audioRef.current.pause();
      }
    };
    useEffect(() => {
      handleIsPlay();
    }, [isPlay]);
    //! end audio controller

    //! start volume
    const handleVolume = (event: never, newValue: number) => {
      setCurrentVolume(newValue as number);
      audioRef.current.volume = newValue / 100;
    };
    const clickV = () => {
      if (currentVolume <= 80) {
        subMedia.current.classList.remove('volume-warning');
      }
    };
    const toggleVolume = () => {
      if (currentVolume === 0) {
        setCurrentVolume(100);
      }

      setIsMute(!isMute);
    };
    useEffect(() => {
      if (isMute) {
        audioRef.current.volume = 0;
        subMedia.current.classList.contains('volume-warning') && subMedia.current.classList.remove('volume-warning');
      } else {
        audioRef.current.volume = currentVolume * ((isMute ? 0 : 1) / 100);
        !subMedia.current.classList.contains('volume-warning') && subMedia.current.classList.add('volume-warning');
      }

      if (currentVolume <= 80) {
        subMedia.current.classList.remove('volume-warning');
      }
    }, [isMute]);
    useEffect(() => {
      localStorage.setItem(VOLUME_STATE, String(currentVolume));
      setIsMute(currentVolume < 0);
      if (currentVolume <= 80) {
        subMedia.current.classList.contains('volume-warning') && subMedia.current.classList.remove('volume-warning');
      } else {
        !subMedia.current.classList.contains('volume-warning') && subMedia.current.classList.add('volume-warning');
      }
    }, [currentVolume]);

    //! end volume

    //! set loop
    const setLoop = () => {
      const loop = Number(localStorage.getItem(LOOP_STATE));
      setLoopState((loop + 1) % 3);
    };
    useEffect(() => {
      localStorage.setItem(LOOP_STATE, loopState.toString());
      switch (loopState) {
        case 1: {
          break;
        }
        case 2: {
          audioRef.current.loop = true;
          break;
        }
        case 0: {
          audioRef.current.loop = false;
          break;
        }
        default: {
          audioRef.current.loop = false;
          break;
        }
      }
    }, [loopState]);
    //! end set loop
    // set value range

    useEffect(() => { // to set total duration of song
      audioRef.current.addEventListener('loadedmetadata', (_) => {
        const dur = Math.floor(audioRef.current.duration);
        setAudioTimerDuration(dur);
      });
      audioRef.current.addEventListener('timeupdate', _ => {
        const current = audioRef.current.currentTime;
        setTimePlaying(current);
      });
      audioRef.current.addEventListener('ended', () => {
        audioRef.current.pause();
        dispatch({ type: 'TOGGLE_PLAYING_SONG', payload: false });
      });
    }, [dispatch]);

    const nameWrapper = React.useRef(null);
    const nameTarget = React.useRef(null);
    const [parentWidth, setParentWidth] = React.useState<number>(null);
    const [targetWidth, setTargetWidth] = React.useState<number>(null);
    useEffect(() => {
      const wp: HTMLDivElement = nameWrapper.current;
      const wt: HTMLDivElement = nameTarget.current;
      if (wp.offsetWidth && wt.scrollWidth) {
        setParentWidth(wp.offsetWidth);
        setTargetWidth(wt.scrollWidth);
      }
      if (wt.scrollWidth > wp.offsetWidth) {
        setInterval(() => {
          const co = wt.classList.contains('automation-text');
          if (!co) {
            wt.classList.add('automation-text');
          }
        }, 5000);
        setInterval(() => {
          const co = wt.classList.contains('automation-text');
          if (co) {
            wt.classList.remove('automation-text');
          }
        }, 20000);
      }
    }, []);

    // ! full screen with lyrics
    const [fsState, setFsState] = React.useState<boolean>(false);
    const [showStState, setShowStState] = React.useState<boolean>(false);
    const [fullScreenState, setFullScreenState] = React.useState<boolean>(false);
    const expandScreen = React.useRef<HTMLDivElement>(null);
    const stTarget = React.useRef(null);
    const toggleExpandMedia = () => {
      setFsState(!fsState);
    };
    const handleClickTooltipAnyway = (type: ToolTipClickState) => {
      if (type === ToolTipClickState.open) {
        setShowStState(true);
      } else if (type === ToolTipClickState.close) {
        setShowStState(false);
      }
    };
    useEffect(() => {

      if (fsState) {
        expandScreen.current.classList.add('expand-wrapper');
      } else {
        expandScreen.current.classList.remove('expand-wrapper');
      }
    }, [fsState]);
    let cd = false;
    const toggleRequestFullScreen = () => {
      setFullScreenState(!fullScreenState);
      cd = !cd;
      try {
        if (!document.fullscreenElement) {
          document.body.requestFullscreen().then();
        } else {
          document.exitFullscreen().then();
        }
      } catch (e) {
        console.log(e);
      }
    };
    // process next, preview song
    const [currentOrderSong, setOrderCurrentSong] = React.useState(0);
    const onNext = (random?: boolean, randomIndex?: number) => {
      if (!random) {
        if (currentOrderSong < REAL_SONG_LIST.length - 1) {
          setOrderCurrentSong(currentOrderSong + 1);
          dispatch({ type: 'CHANGE_PLAYING_SONG', payload: isPlay });
        } else {
          return;
        }
      } else {
        if (currentOrderSong < REAL_SONG_LIST.length - 1) {
          setOrderCurrentSong(randomIndex);
          dispatch({ type: 'CHANGE_PLAYING_SONG', payload: isPlay });
        } else {
          return;
        }
      }
    };
    
    const [rdNumberNotRepeat, setRdNumberNotRepeat] = React.useState<number[]>([]);
    const getRandomNumberSongNotRepeat = () => {
      const rd = Math.floor(Math.random() * (REAL_SONG_LIST.length));
      setRdNumberNotRepeat([...rdNumberNotRepeat, rd]);
      console.log(rdNumberNotRepeat);
      if (rdNumberNotRepeat.length > 1 && rdNumberNotRepeat[rdNumberNotRepeat.length - 1] === rdNumberNotRepeat[rdNumberNotRepeat.length - 2]) {
        console.log('bi lap roi nay');
        return getRandomNumberSongNotRepeat();
      } else {
        console.log('ngon 2');
        return rdNumberNotRepeat[rdNumberNotRepeat.length - 1];
      }
    };
    useEffect(() => {
      const d = getRandomNumberSongNotRepeat();
      console.log(d);
    }, [randomState]);
    const next = () => {
      if (randomState === 'true') {
        onNext(true, getRandomNumberSongNotRepeat());
      } else {
        onNext(false);
      }
    };
    const onPrev = () => {
      if (currentOrderSong === 0) {
        return;
      } else if (currentOrderSong >= REAL_SONG_LIST.length - 1) {
        setOrderCurrentSong(currentOrderSong - 1);
        dispatch({ type: 'CHANGE_PLAYING_SONG', payload: isPlay });
      } else {
        setOrderCurrentSong(currentOrderSong - 1);
        dispatch({ type: 'CHANGE_PLAYING_SONG', payload: isPlay });
      }
    };
    const onRandomSong = () => {
      const a = localStorage.getItem(RANDOM_STATE);
      let x: string;
      if (a === 'true') {
        x = 'false';
        localStorage.setItem(RANDOM_STATE, x);
      } else if (a === 'false') {
        x = 'true';
        localStorage.setItem(RANDOM_STATE, x);
      }
      setRandomState(x);
    };

    useEffect(() => {
      handleIsPlay();
    }, [currentOrderSong]);
    return (
      <div className='media-player-wrapper'>
        <div className={`media-spacing d-flex align-items-center ${isPlay ? 'spl' : ''} ${fsState ? 'tbc' : ''}`}>
          <div className='media-info d-flex align-items-center'>
            <div className={`media-thumb ${isPlay ? 'playing' : ''}`}>
              <div className='thumbnail'>
                <div className='thumbnail-effect'>
                  <img src={REAL_SONG_LIST[currentOrderSong].thumb} alt='' />
                </div>
                <svg className='note note-1'>
                  <use xlinkHref='#note-1' />
                </svg>
                <svg className='note note-2'>
                  <use xlinkHref='#note-2' />
                </svg>
                <svg className='note note-3'>
                  <use xlinkHref='#note-3' />
                </svg>
                <svg className='note note-4'>
                  <use xlinkHref='#note-4' />
                </svg>
                <svg className='kim'>
                  <use xlinkHref='#kim' />
                </svg>
              </div>
            </div>
            <div className='media-detail-info ms-3'>
              <div className={`song-name-control d-flex ${parentWidth < targetWidth ? 'end-overlay' : ''}`}
                   ref={nameWrapper}
              >
                {
                  parentWidth < targetWidth ?
                    <div className='song-name no-wrap' ref={nameTarget}>
                      {REAL_SONG_LIST[currentOrderSong].songName} &nbsp;&nbsp;&nbsp;&nbsp; {REAL_SONG_LIST[currentOrderSong].songName}
                    </div> :
                    <div className='song-name no-wrap' ref={nameTarget}>
                      {REAL_SONG_LIST[currentOrderSong].songName}
                    </div>
                }
              </div>
              <div className='song-artist'>
                <RedirectLink pathName={REAL_SONG_LIST[currentOrderSong].songArtist[0].artistName} contentName={REAL_SONG_LIST[currentOrderSong].songArtist[0].artistName} />
              </div>
            </div>
            <div className='media-song-actions ms-2'>
              <IconButton className='small-action'>
                <FavoriteBorder fontSize={'small'} />
              </IconButton>
              <IconButton className='small-action'>
                <MoreHoriz fontSize={'small'} />
              </IconButton>
            </div>
          </div>
          <div className='media-controls'>
            <div className='control-group-btn'>
              <div className='icon-btn-group d-flex align-items-center'>
                <MyTooltip title={`${randomState === 'true' ? 'Bật' : 'Tắt'} phát ngẫu nhiên`}>
                  <IconButton style={{ transform: 'rotate(90deg)' }} onClick={onRandomSong}>
                    <svg className={`icon-control ${randomState === 'true' ? 'icon-control-active' : ''}`} height={22} width={22}>
                      <use xlinkHref='#random' />
                    </svg>
                  </IconButton>
                </MyTooltip>
                <MyTooltip title='Phát lại bài vừa qua' arrow>
                  <IconButton onClick={onPrev}>
                    <svg className='control-size icon-control'>
                      <use xlinkHref='#pn' />
                    </svg>
                  </IconButton>
                </MyTooltip>
                <div className='main-control'>
                  <IconButton onClick={setPlay}>
                    <svg className='main-icon-btn icon-control'>
                      {!isPlay ? <use xlinkHref='#play' /> : <use xlinkHref='#pause' />}
                    </svg>
                  </IconButton>
                </div>
                <MyTooltip title='Phát bài kế tiếp' arrow>
                  <IconButton onClick={next} style={{ transform: 'rotate(180deg)' }}>
                    <svg className='control-size icon-control'>
                      <use xlinkHref='#pn' />
                    </svg>
                  </IconButton>
                </MyTooltip>
                <MyTooltip title={loopState === 0 ? 'Không lặp lại' : loopState === 1 ? 'Lặp lại toàn bộ' : 'Lặp lại 1 bài'} arrow>
                  <IconButton onClick={setLoop}>
                    <svg className={`control-size icon-control ${loopState === 0 ? '' : 'loop-active'}`}>
                      <use xlinkHref={loopState === 0 ? '#loop' : loopState === 1 ? '#loop-active' : '#loop-1'} />
                    </svg>
                  </IconButton>
                </MyTooltip>
              </div>
              <div className='d-flex align-items-center justify-content-center'>
                <div className={`played-time pe-3 ${isPlay ? 'playing' : ''}`}>{audioDuration(timePlaying)}</div>
                <div className='w-50 align-items-center d-flex'>
                  <Slider
                    value={timePlaying}
                    onChange={handleMediaControlTime}
                    max={Math.floor(audioTimerDuration)}
                    aria-labelledby='continuous-slider'
                  />
                  <audio controls id='app-audio' ref={audioRef} style={{ display: 'none' }} src={REAL_SONG_LIST[currentOrderSong].songArtist[0].songUrl} />
                </div>
                <div className='played-time ps-3'>{audioDuration(audioTimerDuration)}</div>
              </div>
            </div>
          </div>
          <div className='media-sub-actions d-flex align-items-center'>
            {!fsState && <MyTooltip title='MV' arrow>
              <div className='divided-icon-btn'>
                <IconButton>
                  <svg className='control-size-huge icon-control'>
                    <use xlinkHref='#mv' />
                  </svg>
                </IconButton>
              </div>
            </MyTooltip>}
            {!fsState && <MyTooltip title='Xem lời bài hát'>
              <div className='divided-icon-btn'>
                <IconButton onClick={toggleExpandMedia}>
                  <svg className='control-size-huge icon-control'>
                    <use xlinkHref='#micro' />
                  </svg>
                </IconButton>
              </div>
            </MyTooltip>}
            <div className={`d-flex align-items-center divided-icon-btn ${fsState ? '_n' : ''}`} style={{ paddingRight: '20px' }}>
              <IconButton onClick={toggleVolume} className={`${currentVolume <= 80 || isMute ? '' : 'volume-warning-btn'} `}>
                {currentVolume * (isMute ? 0 : 1) > 0 ?
                  <VolumeUp style={{ fontSize: '30px' }} /> :
                  <VolumeOff style={{ fontSize: '30px' }} />}
                {/*       {!volumeController && <VolumeOff style={{ fontSize: '30px' }} />}*/}
              </IconButton>
              <div ref={subMedia} style={{ width: '130px' }} className='d-flex align-items-center ms-2'>
                <Slider
                  value={currentVolume * (isMute ? 0 : 1)}
                  onChange={handleVolume}
                  onClick={clickV}
                  aria-labelledby='continuous-slider'
                />

              </div>
            </div>
            {!fsState && <MyTooltip title={!fullScreenState ? 'Toàn màn hình' : 'Thoát toàn màn hinh'} placement='top' arrow>
              <IconButton onClick={toggleRequestFullScreen}>
                <svg className='control-size icon-control'>
                  <use xlinkHref={!fullScreenState ? '#expand' : '#exit-expand'} />
                </svg>
              </IconButton>
            </MyTooltip>}
          </div>
        </div>
        <div className={`media-expand`} ref={expandScreen}>
          {expandScreen &&
          <div className='side-wrapper'>
            <div className='side-action expand-header'>
              <div className='tabs-control'>
                <Tabs
                  value={tabsValue}
                  onChange={handleTabsChange}
                  textColor='primary'
                >
                  <Tab label='Danh sách phát' {...a11yProps(0)} />
                  <Tab label='Karaoke' {...a11yProps(1)} />
                  <Tab label='Lời bài hát' {...a11yProps(2)} />
                </Tabs>
              </div>
              <div className='expand-controls'>
                <MyTooltip title={!fullScreenState ? 'Toàn màn hình' : 'Thoát toàn màn hinh'}>
                  <IconButton className='icon-btn-hb' onClick={toggleRequestFullScreen}>
                    <svg className='icon-control control-size'>
                      <use xlinkHref={!fullScreenState ? '#expand' : '#exit-expand'} />
                    </svg>
                  </IconButton>
                </MyTooltip>
                <div className='st'>
                  <MyTooltip title='Cài đặt' arrow placement='bottom'>
                    <IconButton
                      className='icon-btn-hb'
                      onClick={() => setShowStState(!showStState)}
                    ><Settings /></IconButton>
                  </MyTooltip>
                  {showStState && <div className='option-wrapper' ref={stTarget}>
                    <div className='ang'>
                      <Button className='option-item'>
                        <div>Hình nền</div>
                        <Switch />
                      </Button>
                      <Button className='option-item'>
                        <div>Chỉ phát nhạc nền</div>
                        <Switch />
                      </Button>
                      <Button disabled className='option-item' style={{ height: '38px' }}>
                        <div>Chọn cỡ chữ phát nhạc</div>
                      </Button>
                    </div>
                  </div>}
                </div>
                <MyTooltip title='Đóng'>
                  <IconButton className='icon-btn-hb' onClick={() => setFsState(false)}>
                    <ArrowBack style={{ transform: 'rotate(-90deg)' }} />
                  </IconButton>
                </MyTooltip>
              </div>
            </div>
            <TabPanel scroll={false} value={tabsValue} index={0}>

              <CarouselExpandItem />

            </TabPanel>
            <TabPanel scroll={false} value={tabsValue} index={1}>
              Hello 2
            </TabPanel>
            <TabPanel scroll={false} value={tabsValue} index={2}>
              Hello 3
            </TabPanel>
          </div>
          }
        </div>
      </div>
    );
  }
;

export default MediaPlayer;
