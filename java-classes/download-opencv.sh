#!/usr/bin/env bash
pushd lib || exit
for platform in windows-x86_64 macosx-x86_64 macosx-arm64; do
  mvn -Djavacpp.platform=$platform org.apache.maven.plugins:maven-dependency-plugin:3.3.0:copy-dependencies -DoutputDirectory=.
done
popd || exit
