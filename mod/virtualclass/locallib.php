<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * Internal library of functions for module virtualclass
 *
 * All the virtualclass specific functions, needed to implement the module
 * logic, should go here. Never include this file from your lib.php!
 *
 * @package    mod_virtualclass
 * @copyright  2014 Pinky Sharma
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

/*
 * Get list of teacher of current course
 *
 * @param null
 * @return object
 */
function virtualclass_course_teacher_list() {
    global $COURSE;

    $courseid = $COURSE->id;

    $context = context_course::instance($courseid);
    $heads = get_users_by_capability($context, 'moodle/course:update');

    $teachers = array();
    foreach ($heads as $head) {
        $teachers[$head->id] = fullname($head);
    }
    return $teachers;
}

/*
 * Create form and send sumbitted value to
 * given url and open in popup
 *
 * @param string $url virtualclass online url
 * @param string $authusername  authenticated user
 * @param string $authpassword  authentication password
 * @param string $role user role eight student or teacher
 * @param string $rid  user authenticated path
 * @param string $room  unique id
 * @param $popupoptions string
 * @param $popupwidth string
 * @param $popupheight string
 * @return string
 */
function virtualclass_online_server($url, $authusername, $authpassword, $role, $rid, $room,
            $popupoptions, $popupwidth, $popupheight, $debug = false) {
    global $USER;
    $form = html_writer::start_tag('form', array('id' => 'overrideform', 'action' => $url, 'method' => 'post',
        'onsubmit' => 'return virtualclass_online_popup(this)', 'data-popupoption' => $popupoptions,
        'data-popupwidth' => $popupwidth, 'data-popupheight' => $popupheight));
    $form .= html_writer::empty_tag('input', array('type' => 'hidden', 'name' => 'sesskey', 'value' => sesskey()));
    $form .= html_writer::empty_tag('input', array('type' => 'hidden', 'name' => 'uid', 'value' => $USER->id));
    $form .= html_writer::empty_tag('input', array('type' => 'hidden', 'name' => 'name', 'value' => $USER->username));
    $form .= html_writer::empty_tag('input', array('type' => 'hidden', 'name' => 'role', 'value' => $role));
    $form .= html_writer::empty_tag('input', array('type' => 'hidden', 'name' => 'room', 'value' => $room));
    $form .= html_writer::empty_tag('input', array('type' => 'hidden', 'name' => 'sid', 'value' => $USER->sesskey));
    $form .= html_writer::empty_tag('input', array('type' => 'hidden', 'name' => 'user', 'value' => $authusername));
    $form .= html_writer::empty_tag('input', array('type' => 'hidden', 'name' => 'pass', 'value' => $authpassword));
    $form .= html_writer::empty_tag('input', array('type' => 'hidden', 'name' => 'rid', 'value' => $rid));
    $form .= html_writer::empty_tag('input', array('type' => 'hidden', 'name' => 'debug', 'value' => $debug));
    $form .= html_writer::empty_tag('input', array('type' => 'submit', 'name' => 'submit',
         'value' => get_string('joinroom', 'virtualclass')));
    $form .= html_writer::end_tag('form');
    return $form;
}

/**
 * Update the calendar entries for this virtualclass.
 *
 * @param object $virtualclass - Required to pass this in because it might
 *                              not exist in the database yet.
 * @return bool
 */

function update_calendar($virtualclass) {
    global $DB, $CFG;
    require_once($CFG->dirroot.'/calendar/lib.php');

    if ($virtualclass->closetime && $virtualclass->closetime > time()) {
        $event = new stdClass();
        $params = array('modulename' => 'virtualclass', 'instance' => $virtualclass->id);
        $event->id = $DB->get_field('event', 'id', $params);
        $event->name = $virtualclass->name;
        $event->timestart = $virtualclass->opentime;

        // Convert the links to pluginfile. It is a bit hacky but at this stage the files
        // might not have been saved in the module area yet.
        $intro = $virtualclass->intro;
        if ($draftid = file_get_submitted_draft_itemid('introeditor')) {
            $intro = file_rewrite_urls_to_pluginfile($intro, $draftid);
        }

        // We need to remove the links to files as the calendar is not ready
        // to support module events with file areas.
        $intro = strip_pluginfile_content($intro);
        $event->description = array(
            'text' => $intro,
            'format' => $virtualclass->introformat
        );

        if ($event->id) {
            $calendarevent = calendar_event::load($event->id);
            $calendarevent->update($event);
        } else {
            unset($event->id);
            $event->courseid    = $virtualclass->course;
            $event->groupid     = 0;
            $event->userid      = 0;
            $event->modulename  = 'virtualclass';
            $event->instance    = $virtualclass->id;
            $event->eventtype   = 'open';
            $event->timeduration = 0;
            calendar_event::create($event);
        }
    } else {
        $DB->delete_records('event', array('modulename' => 'virtualclass', 'instance' => $virtualclass->id));
    }
}
