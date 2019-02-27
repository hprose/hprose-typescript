<p align="center"><img src="https://hprose.com/banner.@2x.png" alt="Hprose" title="Hprose" width="650" height="200" /></p>

# Hprose 3.0 for TypeScript

[![Join the chat at https://gitter.im/hprose/hprose-typescript](https://img.shields.io/badge/GITTER-join%20chat-green.svg)](https://gitter.im/hprose/hprose-typescript?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lernajs.io/)

  package name   |  lastest version  | download 
:---------------|:-----------------|:---------
[![@hprose/io](https://img.shields.io/badge/npm-@hprose/io-red.svg?logo=npm)](https://www.npmjs.com/package/@hprose/io) | [![npm version](https://img.shields.io/npm/v/@hprose/io.svg)](https://www.npmjs.com/package/@hprose/io) | [![npm download](https://img.shields.io/npm/dm/@hprose/io.svg)](https://www.npmjs.com/package/@hprose/io)
[![@hprose/rpc-core](https://img.shields.io/badge/npm-@hprose/rpc--core-red.svg?logo=npm)](https://www.npmjs.com/package/@hprose/rpc-core) | [![npm version](https://img.shields.io/npm/v/@hprose/rpc-core.svg)](https://www.npmjs.com/package/@hprose/rpc-core) | [![npm download](https://img.shields.io/npm/dm/@hprose/rpc-core.svg)](https://www.npmjs.com/package/@hprose/rpc-core)
[![@hprose/rpc-plugin-circuitbreaker](https://img.shields.io/badge/npm-@hprose/rpc--plugin--circuitbreaker-blueviolet.svg?logo=npm)](https://www.npmjs.com/package/@hprose/rpc-plugin-circuitbreaker) | [![npm version](https://img.shields.io/npm/v/@hprose/rpc-plugin-circuitbreaker.svg)](https://www.npmjs.com/package/@hprose/rpc-plugin-circuitbreaker) | [![npm download](https://img.shields.io/npm/dm/@hprose/rpc-plugin-circuitbreaker.svg)](https://www.npmjs.com/package/@hprose/rpc-plugin-circuitbreaker)
[![@hprose/rpc-plugin-cluster](https://img.shields.io/badge/npm-@hprose/rpc--plugin--cluster-blueviolet.svg?logo=npm)](https://www.npmjs.com/package/@hprose/rpc-plugin-cluster) | [![npm version](https://img.shields.io/npm/v/@hprose/rpc-plugin-cluster.svg)](https://www.npmjs.com/package/@hprose/rpc-plugin-cluster) | [![npm download](https://img.shields.io/npm/dm/@hprose/rpc-plugin-cluster.svg)](https://www.npmjs.com/package/@hprose/rpc-plugin-cluster)
[![@hprose/rpc-plugin-limiter](https://img.shields.io/badge/npm-@hprose/rpc--plugin--limiter-blueviolet.svg?logo=npm)](https://www.npmjs.com/package/@hprose/rpc-plugin-limiter) | [![npm version](https://img.shields.io/npm/v/@hprose/rpc-plugin-limiter.svg)](https://www.npmjs.com/package/@hprose/rpc-plugin-limiter) | [![npm download](https://img.shields.io/npm/dm/@hprose/rpc-plugin-limiter.svg)](https://www.npmjs.com/package/@hprose/rpc-plugin-limiter)
[![@hprose/rpc-plugin-loadbalancer](https://img.shields.io/badge/npm-@hprose/rpc--plugin--loadbalancer-blueviolet.svg?logo=npm)](https://www.npmjs.com/package/@hprose/rpc-plugin-loadbalancer) | [![npm version](https://img.shields.io/npm/v/@hprose/rpc-plugin-loadbalancer.svg)](https://www.npmjs.com/package/@hprose/rpc-plugin-loadbalancer) | [![npm download](https://img.shields.io/npm/dm/@hprose/rpc-plugin-loadbalancer.svg)](https://www.npmjs.com/package/@hprose/rpc-plugin-loadbalancer)
[![@hprose/rpc-plugin-log](https://img.shields.io/badge/npm-@hprose/rpc--plugin--log-blueviolet.svg?logo=npm)](https://www.npmjs.com/package/@hprose/rpc-plugin-log) | [![npm version](https://img.shields.io/npm/v/@hprose/rpc-plugin-log.svg)](https://www.npmjs.com/package/@hprose/rpc-plugin-log) | [![npm download](https://img.shields.io/npm/dm/@hprose/rpc-plugin-log.svg)](https://www.npmjs.com/package/@hprose/rpc-plugin-log)
[![@hprose/rpc-plugin-oneway](https://img.shields.io/badge/npm-@hprose/rpc--plugin--oneway-blueviolet.svg?logo=npm)](https://www.npmjs.com/package/@hprose/rpc-plugin-oneway) | [![npm version](https://img.shields.io/npm/v/@hprose/rpc-plugin-oneway.svg)](https://www.npmjs.com/package/@hprose/rpc-plugin-oneway) | [![npm download](https://img.shields.io/npm/dm/@hprose/rpc-plugin-oneway.svg)](https://www.npmjs.com/package/@hprose/rpc-plugin-oneway)
[![@hprose/rpc-plugin-push](https://img.shields.io/badge/npm-@hprose/rpc--plugin--push-blueviolet.svg?logo=npm)](https://www.npmjs.com/package/@hprose/rpc-plugin-push) | [![npm version](https://img.shields.io/npm/v/@hprose/rpc-plugin-push.svg)](https://www.npmjs.com/package/@hprose/rpc-plugin-push) | [![npm download](https://img.shields.io/npm/dm/@hprose/rpc-plugin-push.svg)](https://www.npmjs.com/package/@hprose/rpc-plugin-push)
[![@hprose/rpc-plugin-reverse](https://img.shields.io/badge/npm-@hprose/rpc--plugin--reverse-blueviolet.svg?logo=npm)](https://www.npmjs.com/package/@hprose/rpc-plugin-reverse) | [![npm version](https://img.shields.io/npm/v/@hprose/rpc-plugin-reverse.svg)](https://www.npmjs.com/package/@hprose/rpc-plugin-reverse) | [![npm download](https://img.shields.io/npm/dm/@hprose/rpc-plugin-reverse.svg)](https://www.npmjs.com/package/@hprose/rpc-plugin-reverse)
[![@hprose/rpc-codec-jsonrpc](https://img.shields.io/badge/npm-@hprose/rpc--codec--jsonrpc-ff69b4.svg?logo=npm)](https://www.npmjs.com/package/@hprose/rpc-codec-jsonrpc) | [![npm version](https://img.shields.io/npm/v/@hprose/rpc-codec-jsonrpc.svg)](https://www.npmjs.com/package/@hprose/rpc-codec-jsonrpc) | [![npm download](https://img.shields.io/npm/dm/@hprose/rpc-codec-jsonrpc.svg)](https://www.npmjs.com/package/@hprose/rpc-codec-jsonrpc)
[![@hprose/rpc-html5](https://img.shields.io/badge/npm-@hprose/rpc--html5-blue.svg?logo=npm)](https://www.npmjs.com/package/@hprose/rpc-html5) | [![npm version](https://img.shields.io/npm/v/@hprose/rpc-html5.svg)](https://www.npmjs.com/package/@hprose/rpc-html5) | [![npm download](https://img.shields.io/npm/dm/@hprose/rpc-html5.svg)](https://www.npmjs.com/package/@hprose/rpc-html5)
[![@hprose/rpc-node](https://img.shields.io/badge/npm-@hprose/rpc--node-blue.svg?logo=npm)](https://www.npmjs.com/package/@hprose/rpc-node) | [![npm version](https://img.shields.io/npm/v/@hprose/rpc-node.svg)](https://www.npmjs.com/package/@hprose/rpc-node) | [![npm download](https://img.shields.io/npm/dm/@hprose/rpc-node.svg)](https://www.npmjs.com/package/@hprose/rpc-node)
[![@hprose/rpc-wx](https://img.shields.io/badge/npm-@hprose/rpc--wx-blue.svg?logo=npm)](https://www.npmjs.com/package/@hprose/rpc-wx) | [![npm version](https://img.shields.io/npm/v/@hprose/rpc-wx.svg)](https://www.npmjs.com/package/@hprose/rpc-wx) | [![npm download](https://img.shields.io/npm/dm/@hprose/rpc-wx.svg)](https://www.npmjs.com/package/@hprose/rpc-wx)

## Introduction

*Hprose* is a High Performance Remote Object Service Engine.

It is a modern, lightweight, cross-language, cross-platform, object-oriented, high performance, remote dynamic communication middleware. It is not only easy to use, but powerful. You just need a little time to learn, then you can use it to construct cross language cross platform distributed application system.

*Hprose* supports many programming languages, for example:

* AAuto Quicker
* ActionScript
* ASP
* C++
* Dart
* Delphi/Free Pascal
* dotNET(C#, Visual Basic...)
* Golang
* Java
* JavaScript
* Node.js
* Objective-C
* Perl
* PHP
* Python
* Ruby
* TypeScript
* ...

Through *Hprose*, You can intercommunicate conveniently and efficiently between those programming languages.

This project is the implementation of Hprose for TypeScript.
