/**
 * Copyright 2017 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  AmpAnalytics3pMessageQueue,
} from '../amp-analytics-3p-message-queue';
import {
  AMP_ANALYTICS_3P_MESSAGE_TYPE,
} from '../../../../src/3p-analytics-common';
import {SubscriptionApi} from '../../../../src/iframe-helper';
import {Timer} from '../../../../src/service/timer-impl';
import {adopt} from '../../../../src/runtime';
import * as sinon from 'sinon';

adopt(window);

describe('amp-analytics.amp-analytics-3p-message-queue', () => {
  let sandbox;
  let sentinel = '42';
  let frame;
  let queue;
  let timer;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    frame = {
      getAttribute: function(name) { return 'some_value'; },
      src: 'http://localhost',
      ownerDocument: {
        defaultView: window,
      },
    };
    queue = new AmpAnalytics3pMessageQueue(window, frame);
    timer = new Timer(window);
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('is empty when first created ', () => {
    expect(queue.queueSize()).to.equal(0);
  });

  it('is not ready until setIsReady() is called ', () => {
    expect(queue.isReady()).to.be.false;
    queue.setIsReady();
    expect(queue.isReady()).to.be.true;
  });

  it('queues messages when not ready to send ', () => {
    const beforeCount = queue.queueSize();
    queue.enqueue('some_senderId', 'some_data');
    queue.enqueue('another_senderId', 'some_data');
    const afterCount = queue.queueSize();
    expect(afterCount - beforeCount).to.equal(2);
  });

  it('flushes the queue when ready to send ', () => {
    queue.enqueue('some_senderId', 'some_data');
    queue.setIsReady();
    const afterCount = queue.queueSize();
    expect(afterCount).to.equal(0);
  });

  it('groups messages from same sender ', () => {
    queue.enqueue('letter_sender', 'A');
    queue.enqueue('letter_sender', 'B');
    queue.enqueue('letter_sender', 'C');
    queue.enqueue('number_sender', '1');
    queue.enqueue('number_sender', '2');
    queue.enqueue('number_sender', '3');
    queue.enqueue('number_sender', '4');
    const letterCount = queue.messagesFor('letter_sender').length;
    const numberCount = queue.messagesFor('number_sender').length;
    expect(queue.queueSize()).to.equal(2);
    expect(letterCount).to.equal(3);
    expect(numberCount).to.equal(4);
  });

  it('only allows extraData to be set once per sender ', () => {
    queue.setExtraData('letter_sender', 'A');
    queue.setExtraData('number_sender', '1');

    expect(() => {
      queue.setExtraData('letter_sender', 'B');
    }).to.throw(/Replacing existing extra data/);

    expect(() => {
      queue.setExtraData('number_sender', '2');
    }).to.throw(/Replacing existing extra data/);
  });
});

