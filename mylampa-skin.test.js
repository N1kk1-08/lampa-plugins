'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const skin = require('./mylampa-skin.js');

test('an intentionally empty top bar stays empty after saving and reloading', () => {
    let buttons = skin.normalizeButtons(null);
    for (const button of buttons.slice()) buttons = skin.editButtons(buttons, 'remove', button.id);
    assert.deepEqual(skin.normalizeButtons(JSON.parse(JSON.stringify(buttons))), []);
});
test('custom plugin targets survive storage reload even before the plugin has loaded', () => {
    const entry = {id:'late',type:'menu',key:'action:late_plugin',label:'Мій розділ'};
    const saved = skin.editButtons([], 'add', '', entry);
    assert.equal(skin.normalizeButtons(JSON.parse(JSON.stringify(saved)))[0].key,'action:late_plugin');
});
test('replacing a shortcut retains its identity, custom label and position', () => {
    const before = skin.normalizeButtons(null);
    const after = skin.editButtons(before,'update','movies',{key:'action:cartoon',label:'Для дітей'});
    assert.equal(after[1].id,'movies');
    assert.equal(after[1].key,'action:cartoon');
    assert.equal(after[1].label,'Для дітей');
    assert.equal(before[1].key,'action:movie');
});
test('move operations retain every shortcut and clamp at the ends', () => {
    const initial = skin.normalizeButtons(null);
    const moved = skin.editButtons(initial,'move','favorites',-20);
    assert.deepEqual(moved.map(b=>b.id),['favorites','home','movies','series']);
    assert.deepEqual(skin.editButtons(moved,'move','favorites',-1),moved);
});
test('HTTP links are retained, executable and local-file schemes are rejected', () => {
    assert.equal(skin.safeLink('https://example.com/movie?q=1'),'https://example.com/movie?q=1');
    for(const bad of ['javascript:alert(1)','data:text/html,hello','file:///C:/private','https://','https://\u0000']) assert.equal(skin.safeLink(bad),'');
    assert.equal(skin.normalizeButtons([{id:'bad',type:'link',url:'javascript:alert(1)'}]).length,0);
});
test('duplicate storage identities do not cause one edit to change another shortcut', () => {
    const duplicates=skin.normalizeButtons([{id:'same',key:'action:main'},{id:'same',key:'action:feed'}]);
    assert.notEqual(duplicates[0].id,duplicates[1].id);
    assert.equal(skin.editButtons(duplicates,'remove',duplicates[0].id).length,1);
});
test('malformed storage falls back safely and deleted links are not restored as menu actions', () => {
    assert.deepEqual(skin.normalizeButtons('invalid'),skin.defaults);
    assert.deepEqual(skin.normalizeButtons([null,{},false]),[]);
    assert.deepEqual(skin.editButtons([{id:'link',type:'link',url:'https://example.org',label:'Сайт'}],'remove','link'),[]);
});

test('featured releases use the native primary-source adapter and selected media type', () => {
    assert.equal(skin.featuredQuery('tmdb','all'),'trending/all/week');
    assert.equal(skin.featuredQuery('tmdb','tv'),'trending/tv/week');
    assert.equal(skin.featuredQuery('cub','movie'),'?sort=top&cat=movie');
    assert.equal(skin.featuredQuery('cub','all'),'?sort=top');
});

test('resume finds saved episodes beyond season ten with the native hash separator', () => {
    const card={original_name:'Original series',name:'Серіал'};
    const progress=skin.resumeState(card,{'hash:Original series':{season:11,episode:2}},s=>'hash:'+s,
        key=>key==='hash:11:2Original series'?{percent:50,time:1500,duration:3000,updated:20}:{percent:0});
    assert.equal(progress.hash,'hash:11:2Original series');
    assert.equal(progress.season,11);
    assert.equal(progress.episode,2);
    assert.equal(progress.time,1500);
});

test('resume uses the original title timeline and does not invent missing duration', () => {
    const progress=skin.resumeState({original_title:'Original film',title:'Фільм'},{},s=>s,
        key=>key==='Original film'?{percent:42,time:1200,updated:10}:{percent:0});
    assert.equal(progress.hash,'Original film');
    assert.equal(progress.percent,42);
    assert.equal(progress.duration,0);
    const empty=skin.resumeState({original_name:'Series'},{},s=>s,()=>({percent:0}),()=>[]);
    assert.equal(empty.episode,0);
    assert.equal(empty.time,0);
});

test('resume can read legacy first-season marks and derives bounded progress from time', () => {
    const progress=skin.resumeState({original_name:'Series'},{},s=>s,()=>({}),
        ()=>[{ep:3,view:{hash:'last',time:1800,duration:3600,updated:30}},
             {ep:4,view:{hash:'older',time:600,duration:3600,updated:20}}]);
    assert.equal(progress.episode,3);
    assert.equal(progress.percent,50);
    assert.equal(skin.minuteLabel(3720),'1 год 2 хв');
});


test('metadata colors use meaningful value ranges and leave missing ratings neutral', () => {
    assert.equal(skin.ratingTone(8.2),'good');
    assert.equal(skin.ratingTone('5,5'),'warning');
    assert.equal(skin.ratingTone(4),'bad');
    for(const value of [0,null,undefined,'—',-1,12]) assert.equal(skin.ratingTone(value),'neutral');
    assert.equal(skin.ageTone('17+'),'orange');
    assert.equal(skin.ageTone('18+'),'bad');
    assert.equal(skin.statusTone('Returning Series'),'warning');
    assert.equal(skin.statusTone('Ended'),'good');
});
test('torrent availability distinguishes zero seeds from unavailable statistics', () => {
    assert.equal(skin.torrentTones({seeds:20}).torrent,'good');
    assert.equal(skin.torrentTones({seeds:16}).torrent,'warning');
    assert.equal(skin.torrentTones({seeds:2}).torrent,'bad');
    assert.equal(skin.torrentTones({seeds:0}).torrent,'bad');
    assert.equal(skin.torrentTones({seeds:null}).torrent,'neutral');
    assert.equal(skin.torrentTones({seeds:'—'}).torrent,'neutral');
});
test('measured download capacity is compared to bitrate and supersedes the seed estimate', () => {
    assert.equal(skin.torrentTones({seeds:1,bitrate:20,speedMbps:30}).torrent,'good');
    assert.equal(skin.torrentTones({seeds:50,bitrate:20,speedMbps:22}).torrent,'warning');
    assert.equal(skin.torrentTones({seeds:50,bitrate:20,speedMbps:0}).torrent,'bad');
    assert.equal(skin.torrentTones({seeds:20,bitrate:20}).measured,false);
    assert.equal(skin.torrentTones({seeds:20,bitrate:20,speedMbps:0}).measured,true);
});
test('bitrate chips use megabits per second and do not treat unknown values as low speed', () => {
    assert.equal(skin.torrentTones({bitrate:'15.2'}).bitrate,'good');
    assert.equal(skin.torrentTones({bitrate:'5,2'}).bitrate,'warning');
    assert.equal(skin.torrentTones({bitrate:4}).bitrate,'bad');
    for(const value of [0,null,'—',undefined]) assert.equal(skin.torrentTones({bitrate:value}).bitrate,'neutral');
});

test('duration uses film runtime or episode data without invented series lengths', () => {
    assert.deepEqual(skin.releaseDuration({runtime:136}),{minutes:136,series:false});
    assert.deepEqual(skin.releaseDuration({first_air_date:'2023-01-01',episode_run_time:[0,55,65]}),{minutes:60,series:true});
    assert.deepEqual(skin.releaseDuration({original_name:'Example',seasons:[{episodes:4}],last_episode_to_air:{runtime:61}}),{minutes:61,series:true});
    assert.deepEqual(skin.releaseDuration({media_type:'tv',runtime:90}),{minutes:0,series:true});
    assert.deepEqual(skin.releaseDuration({runtime:undefined}),{minutes:0,series:false});
});