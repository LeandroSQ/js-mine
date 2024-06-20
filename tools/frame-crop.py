#!/bin/python

# Given a folder containing images ordered by frame number
# This script will ensure the images will start at 0 and end at the last frame

import os
import sys

# Check if the user provided a folder
if len(sys.argv) < 2:
	print("Usage: python frame-crop.py <folder>")
	sys.exit(1)

# Get the folder
folder = sys.argv[1]

# Get the list of files in the folder
files = os.listdir(folder)

# Filter out non-image files
files = [f for f in files if f.endswith(".png")]
print("Number of files:", len(files))

# Sort the files by frame number not filename
files = sorted(files, key=lambda x: int(x.split(".")[0]))

# Get the first and last frame
first_frame = int(files[0].split(".")[0])
last_frame = int(files[-1].split(".")[0])
print("First frame:", first_frame)
print("Last frame:", last_frame)

# Rename the files
offset = -first_frame
print("Detected offset:", offset)
for i in range(first_frame, last_frame + 1):
	old_name = os.path.join(folder, str(i) + ".png")
	new_name = os.path.join(folder, str(i + offset) + ".png")
	os.rename(old_name, new_name)

	progress = (i - first_frame) / (last_frame - first_frame) * 100
	if progress % 11 == 0:
		print("Progress: %.2f%%" % progress)

print("Done!")